'use strict';

class FakeServerBridge {
  constructor() {
    this.rememberedEmail = null;
    this.rememberedCode = null;
    this.loggedInUserEmail = null;
  }
  delayed_(callbackThatReturnsAPromise) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        callbackThatReturnsAPromise().then(
            (value) => setTimeout(() => resolve(value), 100),
            (value) => setTimeout(() => reject(value), 100));
      }, 100);
    });
  }
  login(email, code) {
    return this.delayed_(() => {
      this.loggedInUserEmail = email;
      return Promise.resolve();
    });
  }
  sendLogInLink(email) {
    return this.delayed_(() => {
      return Promise.resolve();
    });
  }
}
