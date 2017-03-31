
function iosRespond(requestId, responseCode, responseBodyJSON) {
  var event = new CustomEvent("ghvz-ios-response");
  event.requestId = requestId;
  event.responseCode = responseCode;
  event.responseBodyJSON = responseBodyJSON;
  document.dispatchEvent(event);
}

class MobileRequester extends Requester {
  constructor() {
    super();
    this.nextRequestId = 1;
    this.openRequestsById = {};
    document.addEventListener("ghvz-ios-response", this.handleResponse_.bind(this));
  }
  sendRequest_(verb, path, body) {
    const requestId = this.nextRequestId++;
    let [promise, resolve, reject] = newPromise();
    this.openRequestsById[requestId] = {
      requestId: requestId,
      resolve: resolve,
      reject: reject,
      promise: promise,
    };

    // Normally, we'd send an AJAX request.
    // But, IOS can only pay attention to page loads, and doesn't see ajax
    // requests.
    // So, we have to use window.location, or an iframe's src to fire a page
    // load, IOS sees that.
    // Using window.location seems to interfere with this page's animation
    // sometimes (i think a window.location change notifies all animations to
    // stop) so we use iframes.
    // Since we only have an iframe url to work with, we have to put the entire
    // body into the url as an extra parameter.
    // Tested the parameter with a 2500-char-long body, so length doesnt seem
    // to be an issue.
    let url = "https://ghvz/request?requestId=" + requestId;
    url += "&verb=" + encodeURIComponent(verb);
    url += "&path=" + encodeURIComponent(path);
    if (body) {
      url += "&body=" + encodeURIComponent(JSON.stringify(body));
    }
    var iframe = document.createElement("iframe");
    iframe.setAttribute("src", url);
    document.documentElement.appendChild(iframe);
    iframe.parentNode.removeChild(iframe);
    iframe = null;
    return promise;
  }
  handleResponse_(event) {
    var requestId = event.requestId;
    if (!(requestId in this.openRequestsById)) {
      console.error('Response for not open request? ' + requestId);
      return;
    }
    alert('got response!' + event.requestId + ' ' + event.responseCode + ' ' + event.responseBodyJSON);
    var openRequest = this.openRequestsById[requestId];
    var responseCode = event.responseCode;
    var responseBody = JSON.parse(decodeURIComponent(event.responseBodyJSON || ""));
    if (responseCode >= 200 && responseCode < 300) {
      openRequest.resolve(responseBody);
    } else {
      openRequest.reject(responseBody);
    }
    delete this.openRequestsById[requestId];
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
