// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.


function newPromise() {
  let savedResolve, savedReject;
  let promise = new Promise((resolve, reject) => {
    savedResolve = resolve;
    savedReject = reject;
  });
  return [promise, savedResolve, savedReject];
}

class NormalRequester {
  constructor(serverUrl, errorHandler) {
    assert(serverUrl);
    this.serverUrl = serverUrl;
    this.errorHandler = errorHandler;
    this.userIdJwt = null;
    this.userId = null;
    this.playerId = null;
    this.waitingRequests = [];
    this.openRequestPromise = Promise.resolve(null);
  }
  setRequestingUserIdAndJwt(userIdJwt, userId) {
    this.userId = userId;
    this.userIdJwt = userIdJwt;
  }
  setRequestingPlayerId(playerId) {
    this.playerId = playerId;
  }

  sendRequest(method, body) {
    return new Promise((resolve, reject) => {
      body = Utils.copyOf(body);
      body.requestingUserIdJwt = this.userIdJwt;
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
      if (Utils.getParameterByName('logrequests', null)) {
        for (let request of requests) {
          console.log(request.method, request.body);
        }
      }
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
      this.errorHandler('There was an error with your request: ' + ajaxRequest.responseText);
      for (let i = 0; i < requests.length; i++) {
        requests[i].reject(ajaxRequest.responseText);
      }
    }
  }
}
