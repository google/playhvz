
function newPromise() {
  let savedResolve, savedReject;
  let promise = new Promise((resolve, reject) => {
    savedResolve = resolve;
    savedReject = reject;
  });
  return [promise, savedResolve, savedReject];
}

class NormalRequester {
  constructor(serverUrl) {
    assert(serverUrl);
    this.serverUrl = serverUrl;
    this.userToken = null;
    this.userId = null;
    this.playerId = null;
    this.waitingRequests = [];
    this.openRequestPromise = Promise.resolve(null);
  }
  setRequestingUserTokenAndId(userToken, userId) {
    this.userId = userId;
    this.userToken = userToken;
  }
  setRequestingPlayerId(playerId) {
    this.playerId = playerId;
  }

  sendRequest(method, body) {
    return new Promise((resolve, reject) => {
      body = Utils.copyOf(body);
      body.requestingUserToken = 'ohgodwhatisthis';//this.userToken;
      if (!('requestingUserId' in body))
        body.requestingUserId = this.userId;
      if (!('requestingPlayerId' in body))
        body.requestingPlayerId = this.playerId;

      let wereNoWaitingRequests = this.waitingRequests.length == 0;
      this.waitingRequests.push({
        method: method,
        body: body,
        resolve: resolve,
        reject: reject,
      });
      if (wereNoWaitingRequests) {
        setTimeout(() => {
          this.openRequestPromise =
              this.openRequestPromise.then(() => {
                return this.sendRequests_();
              });
        }, 0);
      }
    });
  }

  sendRequests_() {
    return new Promise((resolve, reject) => {
      let requests = this.waitingRequests;
      this.waitingRequests = [];
      let requestBody =
          requests.map((waitingRequest) => ({
            method: waitingRequest.method,
            body: Utils.copyOf(waitingRequest.body),
          }));
      var ajaxRequest = new XMLHttpRequest();
      ajaxRequest.open('POST', this.serverUrl + 'api/batch', true);
      ajaxRequest.send(JSON.stringify(requestBody));
      ajaxRequest.onreadystatechange = () => {
        if (ajaxRequest.readyState == XMLHttpRequest.DONE) {
          this.handleResponse_(requests, ajaxRequest);
          resolve();
        }
      };
    });
  }

  handleResponse_(requests, ajaxRequest) {
    if (ajaxRequest.status == 200) {
      let results = JSON.parse(ajaxRequest.responseText);
      for (let i = 0; i < requests.length; i++) {
        if (i < results.length) {
          requests[i].resolve(results[i]);
        } else {
          requests[i].reject("No result for request to " + requests[i].method);
        }
      }
    } else {
      for (let i = 0; i < requests.length; i++) {
        requests[i].reject(ajaxRequest.responseText);
      }
    }
  }
}
