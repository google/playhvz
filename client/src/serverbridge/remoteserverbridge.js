
class RemoteServerBridge {
  constructor(mobile) {
    this.requester = mobile ? new MobileRequester() : new NormalRequester();
  }
  sendLogInLink(email) {
    return this.requester.sendGetRequest('v1/users/' + email + '/sendloginlink', {});
  }
  login(email, code) {
    // Android/IOS should attach to this request the auth code.
    // Web should do it automatically if it's in a cookie.
    return this.requester.sendGetRequest('v1/users/' + email + '/login', { authCode: code });
  }
  addUser(email) {
    // The response to this should contain an auth code as a cookie.
    // It should be read by Android/IOS and stored somewhere.
    // Web will automatically store it, since it's a cookie.
    return this.requester.sendPutRequest('v1/users/' + email, {});
  }
  findUser(email) {
    return this.requester.sendGetRequest('v1/users/' + email);
  }
}
