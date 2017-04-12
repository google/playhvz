
class NormalRequester {
  constructor(serverUrl) {
    assert(serverUrl);
    this.serverUrl = serverUrl;
    this.headers = {};
    this.openRequests = [];
  }
  setHeaders(headers) {
    this.headers = headers;
  }
  sendRequest_(verb, path, body) {
    const requestId = this.nextRequestId++;
    let [promise, resolve, reject] = newPromise();
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
    request.open(verb, "https://googlehvz.com/" + path, true);
    for (var key in this.headers) {
      request.setRequestHeader(key, this.headers[key]);
    }
    this.openRequests.push({
      request: request,
      resolve: resolve,
      reject: reject,
      promise: promise,
    });
    if (body) {
      request.send(JSON.stringify(body));
    } else {
      request.send();
    }
    return promise;
  }
  sendGetRequest(path) {
    return this.sendRequest_('GET', path, null);
  }
  sendPutRequest(path, body) {
    return this.sendRequest_('PUT', path, body);
  }
  sendPostRequest(path, body) {
    return this.sendRequest_('POST', path, body);
  }
}
