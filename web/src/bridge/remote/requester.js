
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
    this.headers = {};
    this.openRequests = [];
    this.nextRequestId = 1;
  }
  setHeaders(headers) {
    this.headers = headers;
  }
  sendRequest_(verb, path, urlParams, body) {
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

    var urlParamsStr = "";
    for (var key in urlParams) {
      urlParamsStr +=
          (urlParamsStr && "&") +
          key + "=" + encodeURIComponent(urlParams[key]);
    }
    let url = this.serverUrl + path + (urlParamsStr && "?" + urlParamsStr);
    request.open(verb, url, true);
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
