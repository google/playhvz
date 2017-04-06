'use strict';

class ServerBridge {
  sendLoginLink(email) { console.error('called base sendLoginLink', this, arguments); }
  login(email, code) { console.error('called base login', this, arguments); }
}
