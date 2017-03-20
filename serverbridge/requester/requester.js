
function newPromise() {
  let resolve;
  let reject;
  let promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return [promise, resolve, reject];
}

class Requester {
  sendGetRequest(path) { console.error('Called base sendGetRequest!'); }
  sendPutRequest(path, body) { console.error('Called base sendPutRequest!'); }
  sendPostRequest(path, body) { console.error('Called base sendPostRequest!'); }
}
