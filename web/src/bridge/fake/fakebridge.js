'use strict';

class FakeBridge {
  constructor(userIds, idGenerator, destination) {
    this.databaseOperations = [];
    this.gatedWriter = new GatedWriter(destination, false);
    var mappingWriter = new MappingWriter(this.gatedWriter);
    var fakeServer = new FakeServer(idGenerator, mappingWriter, new Date().getTime());
    var checkedServer = new CheckedServer(idGenerator, fakeServer, Bridge.SERVER_METHODS_MAP);
    var cloningFakeSerer = new CloningWrapper(checkedServer, Bridge.SERVER_METHODS);
    var delayingCloningFakeServer = new DelayingWrapper(cloningFakeSerer, Bridge.SERVER_METHODS, 100);
    this.server = delayingCloningFakeServer;

    setTimeout(() => this.performOperations_(), 37);

    window.fakeBridge = this;

    populateFakeServer(checkedServer, userIds);

    for (const funcName of Bridge.SERVER_METHODS) {
      this[funcName] = (...args) => this.server[funcName](...args);
    }
  }
  signIn() {
    return new Promise((resolve, reject) => {
      if (!this.userId) {
        this.userId = this.bridge.newUserId();
        this.server.register({userId: this.userId, name: "Person Namey"});
      }
      this.server.signIn(this.userId)
          .then((userId) => {
            resolve(userId);
          });
    });
  }
  attemptAutoSignIn() {
    return new Promise((resolve, reject) => {
      if (this.userId) {
        this.server.signIn(this.userId)
            .then((userId) => {
              resolve(userId);
            });
      } else {
        reject('Nope!');
      }
    });
  }
  listenToGamePublic(gameId) {
    // Do nothing. This method is really just an optimization.
  }
  listenToGamePrivate(gameId, playerId) {
    // Do nothing. This method is really just an optimization.
  }
  performOperations_() {
    this.gatedWriter.openGate();
    this.gatedWriter.closeGate();
    setTimeout(() => this.performOperations_(), 100);
  }
}

function CloningWrapper(inner, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      // console.log('Calling', funcName, 'with args', ...args);
      return Utils.copyOf(inner[funcName](...args.map(Utils.copyOf)));
    }
  }
}

function DelayingWrapper(inner, funcNames, delay) {
  delay = delay || 100;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      // console.log('Making request', funcName, ...args);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // console.log('Recipient received request', funcName, ...args);
            const result = inner[funcName](...args);
            // console.log('Recipient responding with', result);
            setTimeout(() => resolve(result), delay);
          } catch (error) {
            console.error(error);
            setTimeout(() => reject(error), delay);
          }
        }, delay);
      });
    };
  }
}
