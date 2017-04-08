'use strict';

class FakeBridge {
  constructor(delegate) {
    this.delegate = delegate;
    this.databaseOperations = [];
    this.delayedDatabaseOperations = [];
    this.userId = null;
    this.gameId = null;

    var fakeServerDelegate = {
      broadcastDatabaseOperation: (operation) => {
        this.delayedDatabaseOperations.push(operation);
      },
      onUserSignedIn: (userId) => this.delegate.onUserSignedIn(userId),
    };
    var cloningFakeServerDelegate =
        new CloningWrapper(
            fakeServerDelegate,
            ["broadcastDatabaseOperation", "onUserSignedIn"]);
    var delayingCloningFakeServerDelegate =
        new DelayingWrapper(
            cloningFakeServerDelegate,
            ["broadcastDatabaseOperation", "onUserSignedIn"],
            500);

    var fakeServer = new FakeServer(delayingCloningFakeServerDelegate);
    var cloningFakeSerer = new CloningWrapper(fakeServer, ["signIn"]);
    var delayingCloningFakeServer = new DelayingWrapper(cloningFakeSerer, ["signIn"], 1000);
    this.server = delayingCloningFakeServer;

    setTimeout(() => this.performOperations_(), 100);

    window.fakeBridge = this;

    fakeServer.fill();
  }
  attemptAutoSignIn() {
    this.server.signIn()
        .then((user) => {
          this.userId = user.id;
          this.delegate.set(
              "user",
              Utils.copyOf(this.delegate.get("usersById." + this.userId)));
          this.delegate.onUserSignedIn(user.id);
        });
  }
  setGameId(gameId) {
    this.gameId = gameId;
    this.delegate.set(
        "game",
        this.setupMaps(Utils.copyOf(this.delegate.get("gamesById." + gameId))));
  }
  // Used on an entire object that is coming in with no maps in it, just arrays.
  // For example, when the entire game mirror is coming in.
  setupMaps(object) {
    for (var key in object) {
      if (object[key] instanceof Array) {
        var map = {};
        for (let element of object[key])
          map[element.id] = element;
        object[key + "ById"] = map;
        // Recurse, do it to every array
        for (let element of object[key])
          this.setupMaps(element);
      } else if (object[key] === null) {
        // do nothing
      } else if (typeof object[key] == 'object') {
        assert(false); // curiosity
      } else {
        // do nothing
      }
    }
    return object;
  }
  performOperations_() {
    let operationsToPerformNow = this.databaseOperations;
    this.databaseOperations = this.delayedDatabaseOperations;
    this.delayedDatabaseOperations = [];
    for (let operation of this.databaseOperations) {
      this.performOperationAndMaybeOnCorrespondingMirrorAndMap_(operation);
    }
    setTimeout(() => this.performOperations_(), 100);
  }
  performOperationAndMaybeOnCorrespondingMirrorAndMap_(operation) {
    this.performOperationAndMaybeOnCorrespondingMap_(operation);
    let path = operation.path;
    if (this.gameId && path[0] == "games" && path[1] == this.gameId) {
      let mirrorOperation = Utils.copyOf(operation);
      mirrorOperation.path = ["game"].concat(operation.path.slice(2));
      this.performOperationAndMaybeOnCorrespondingMap_(mirrorOperation);
    }
    if (this.userId && path[0] == "users" && path[1] == this.userId) {
      let mirrorOperation = Utils.copyOf(operation);
      mirrorOperation.path = ["user"].concat(operation.path.slice(2));
      this.performOperationAndMaybeOnCorrespondingMap_(mirrorOperation);
    }
  }

  getPathInCorrespondingMap_(operation, id) {
    let path = operation.path.slice();
    // path is now ["game", "chatRooms", "0", "messages"]
    let arrayName = path[path.length - 1]; // "messages"
    path = path.slice(0, path.length - 1);
    // path is now ["game", "chatRooms", "0"]
    path.push(arrayName + "ById");
    // path is now ["game", "chatRooms", "0", "messagesById"]
    path.push(id);
    assert(id);
    // path is now ["game", "chatRooms", "0", "messagesById", "blork"]
    return path;
  }

  performOperationAndMaybeOnCorrespondingMap_(originalOperation) {
    if (originalOperation.type == 'push') {
      let mappedOperation = {
        type: 'set',
        path: this.getPathInCorrespondingMap_(originalOperation, originalOperation.value.id),
        value: originalOperation.value,
      };
      this.performOperation_(mappedOperation);
      this.performOperation_(originalOperation);
    } else if (originalOperation.type == 'remove') {
      let objectPath = operation.path.concat([operation.index]);
      let object = this.delegate.get(objectPath.join('.'));
      assert(object);
      let objectId = object.id;
      assert(objectId);
      this.performOperation_(originalOperation);
      let mappedOperation = {
        type: 'set',
        path: this.getPathInCorrespondingMap_(originalOperation, objectId),
        value: undefined,
      };
      this.performOperation_(mappedOperation);
    } else if (originalOperation.type == 'set') {
      this.performOperation_(originalOperation);
    } else {
      throwError('Dunno what to do with this operation', originalOperation);
    }
  }
  performOperation_(operation) {
    let {path, type, value, index, numToRemove, toInsert} = operation;
    switch (type) {
      case 'set': {
        this.delegate.set(path.join('.'), value);
      } break;
      case 'push': {
        let existingThing = this.delegate.get(path.join('.'));
        assert(existingThing, "Nothing at path", path);
        this.delegate.push(path.join('.'), value);
      } break;
      case 'remove': {
        let existingThing = this.delegate.get(path.join('.'));
        assert(existingThing, "Nothing at path", path);
        this.delegate.splice(path.join('.'), index, 1);
      } break;
      default:
        throwError('Unknown operation:', operation);
    }
  }
}
// this.__proto__ = inner; would be if we ever want to completely
// opt out of a layer for a certain function. like if we ever
// had a getAllGames method, we'd just completely opt it out of
// the securing layer.
// However, that would accidentally bring properties in, and call
// functions on the wrong scopes, so lets stick to doing it manually

// note to self, dont call superclass methods by saying
// this.__proto__.someMethod.call(this, stuff)
// because this.__proto__ is the base class of the leaf class.
// if you call it from a base class, it's still the base class of
// the leaf class.

// function SecuringWrapper(inner, isLoggedIn, funcNames) {
//   for (const funcName of funcNames) {
//     this[funcName] = function(...args) {
//       if (!isLoggedIn()) {
//         throw "Not logged in! Can't call " + funcName;
//       }
//       return inner[funcName](...args);
//     }
//   }
// }

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

function oldmakeFakePrepopulatedbridge() {
  window.fakeServer = fakeServer;

  var loggedInUserId = null;

  // const securedFakeServer =
  //     new SecuringWrapper(
  //         fakeServer,
  //         (() => !!loggedInUserId),
  //         Utils.subtract(SERVER_METHODS, "logIn", "register", "getUserById"));
  // securedFakeServer.logIn = (authcode) => {
  //   if (authcode != 'firstuserauthcode') {
  //     throw "Couldnt find auth code";
  //   }
  //   var userId = kimUserId;
  //   // To check it exists. this.__proto__ to skip the security check
  //   fakeServer.getUserById(userId);
  //   loggedInUserId = userId;
  //   return userId;
  // };
  // securedFakeServer.register = (...args) => fakeServer.register(...args);
  // securedFakeServer.getUserById = (userId) => {
  //   if (loggedInUserId != userId)
  //     throw 'Cant get other user';
  //   return fakeServer.getUserById(userId);
  // };

  const cloningFakeServer =
      new CloningWrapper(fakeServer, SERVER_METHODS);

  const delayingCloningFakeServer =
      new DelayingWrapper(cloningFakeServer, SERVER_METHODS);

  return delayingCloningFakeServer;
}
