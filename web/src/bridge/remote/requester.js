
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
    this.openRequestPromise = Promise.resolve(null);
    this.playerId = null;
  }
  setRequestingPlayerId(playerId) {
    this.playerId = playerId;
  }
  // Take this method out when the server single-threads itself
  sendRequest_(verb, path, urlParams, body) {
    if (this.openRequestPromise) {
      this.openRequestPromise =
          this.openRequestPromise.then(() => {
            console.log('Sending!', path);
            return this.sendRequestInner_(verb, path, urlParams, body);
          });
    } else {
      this.openRequestPromise =
          this.sendRequestInner_(verb, path, urlParams, body);
    }
    return this.openRequestPromise;
  }

  sendRequestInner_(verb, path, urlParams, body) {
    let [promise, resolve, reject] = newPromise();

    let auth = firebase.auth();
    let currentUser = auth.currentUser;
    currentUser.getToken(false).then((userToken) => {
      body.requestingUserToken = userToken;
      if (!('requestingUserId' in body))
        body.requestingUserId = 'user-' + currentUser.uid;
      if (!('requestingPlayerId' in body))
        body.requestingPlayerId = this.playerId;

      var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
        if (request.readyState == XMLHttpRequest.DONE ) {
          if (request.status == 200) {
            var result = JSON.parse(request.responseText);
            resolve(result);
          } else {
            reject('Error ' + request.status + ' ' + request.statusText);
          }
        }
      };

      urlParams = urlParams || {};
      var urlParamsStr = "";
      for (var key in urlParams) {
        urlParamsStr +=
            (urlParamsStr && "&") +
            key + "=" + encodeURIComponent(urlParams[key]);
      }
      let url = this.serverUrl + 'api/' + path + (urlParamsStr && "?" + urlParamsStr);
      request.open(verb, url, true);

      if (body) {
        request.send(JSON.stringify(body));
      } else {
        request.send();
      }
    });

    return promise;
  }
  sendGetRequest(path, urlParams) {
    return this.sendRequest_('GET', path, urlParams, null);
  }
  sendPutRequest(path, urlParams, body) {
    return this.sendRequest_('PUT', path, urlParams, body);
  }
  sendPostRequest(path, urlParams, body) {
    return this.sendRequest_('POST', path, urlParams, body);
  }
}
