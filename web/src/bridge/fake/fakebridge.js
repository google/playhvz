'use strict';

class FakeBridge {
  constructor(userIds, idGenerator) {
    this.databaseOperations = [];
    this.unmappedDatabase = {};
    this.teeWriter = new TeeWriter();
    this.teeWriter.addDestination(new SimpleWriter(this.unmappedDatabase));
    var fakeServer = new FakeServer(idGenerator, this.teeWriter, new Date().getTime());
    var checkedServer = new CheckedServer(idGenerator, fakeServer, Bridge.SERVER_METHODS_MAP);
    var cloningFakeSerer = new CloningWrapper(checkedServer, Bridge.SERVER_METHODS);
    var delayingCloningFakeServer = new DelayingWrapper(cloningFakeSerer, Bridge.SERVER_METHODS, 100);
    this.server = delayingCloningFakeServer;

    window.fakeBridge = this;

    populateUsers(checkedServer, userIds);

    let populate = Utils.getParameterByName('populate', 'light');
    assert(populate == 'light' || populate == 'heavy' || populate == 'none', "populate must be light, heavy, or none");
    if (populate != 'none') {
      populateGame(checkedServer, userIds, populate == 'heavy');
    }

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
  listenToDatabase({destination}) {
    var gatedWriter = new GatedWriter(new MappingWriter(destination), false);
    gatedWriter.batchedWrite([
      {
        type: 'set',
        path: ['games'],
        value: Utils.copyOf(this.unmappedDatabase.games),
      },
      {
        type: 'set',
        path: ['guns'],
        value: Utils.copyOf(this.unmappedDatabase.guns),
      },
      {
        type: 'set',
        path: ['users'],
        value: Utils.copyOf(this.unmappedDatabase.users),
      }
    ]);
    this.teeWriter.addDestination(gatedWriter);

    var interval =
        setInterval(() => {
          gatedWriter.openGate();
          gatedWriter.closeGate();
        }, 100);

    return () => {
      clearInterval(interval);
      this.teeWriter.removeDestination(gatedWriter);
    };
  }
  listenToGameAsAdmin(gameId) {
    // Do nothing. This method is really just an optimization.
  }
  listenToGameAsNonAdmin(gameId, playerId) {
    // Do nothing. This method is really just an optimization.
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
