'use strict';

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

function SecuringWrapper(inner, isLoggedIn, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      if (!isLoggedIn()) {
        throw "Not logged in! Can't call " + funcName;
      }
      return inner[funcName](...args);
    }
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

function DelayingWrapper(inner, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = inner[funcName](...args);
            setTimeout(() => resolve(result));
          } catch (error) {
            console.error(error);
            setTimeout(() => reject(error));
          }
        }, 100);
      });
    };
  }
}

function makeFakePrepopulatedServerBridge() {
  var kimUserId = Utils.generateId("user");
  var evanUserId = Utils.generateId("user");
  var kimPlayerId = Utils.generateId("player");
  var evanPlayerId = Utils.generateId("player");
  var gameId = Utils.generateId("game");
  var humanChatRoom = Utils.generateId("chat");
  var zedChatRoom = Utils.generateId("chat");
  var firstMissionId = Utils.generateId("mission");
  var fakeServer = new FakeServer();
  fakeServer.register(kimUserId, 'kimikimkim@kim.com');
  fakeServer.register(evanUserId, 'verdagon@evan.com');
  fakeServer.createGame(gameId, kimUserId);
  fakeServer.joinGame(kimUserId, gameId, kimPlayerId, 'Kim the Ultimate', {});
  fakeServer.joinGame(evanUserId, gameId, evanPlayerId, 'Evanpocalypse', {});
  fakeServer.createChatRoom(humanChatRoom, kimPlayerId);
  fakeServer.addPlayerToChatRoom(humanChatRoom, evanPlayerId);
  fakeServer.addMessageToChatRoom(humanChatRoom, kimPlayerId, 'hi');
  fakeServer.createChatRoom(zedChatRoom, evanPlayerId);
  fakeServer.addPlayerToChatRoom(zedChatRoom, kimPlayerId);
  fakeServer.addMessageToChatRoom(zedChatRoom, evanPlayerId, 'zeds rule!');
  fakeServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'hoomans drool!');
  fakeServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'monkeys eat stool!');
  fakeServer.addMission(gameId, firstMissionId, new Date().getTime() - 1000, new Date().getTime() + 1000 * 60 * 60, "/firstgame/missions/first-mission.html");

  var loggedInUserId = null;

  const securedFakeServer =
      new SecuringWrapper(
          fakeServer,
          (() => !!loggedInUserId),
          subtract(SERVER_METHODS, "logIn", "register", "getUserById"));
  securedFakeServer.logIn = (authcode) => {
    if (authcode != 'firstuserauthcode') {
      throw "Couldnt find auth code";
    }
    var userId = kimUserId;
    // To check it exists. this.__proto__ to skip the security check
    fakeServer.getUserById(userId);
    loggedInUserId = userId;
    return userId;
  };
  securedFakeServer.register = (...args) => fakeServer.register(...args);
  securedFakeServer.getUserById = (userId) => {
    if (loggedInUserId != userId)
      throw 'Cant get other user';
    return fakeServer.getUserById(userId);
  };

  const cloningSecuredFakeServer =
      new CloningWrapper(securedFakeServer, SERVER_METHODS);

  const delayingCloningSecuredFakeServer =
      new DelayingWrapper(cloningSecuredFakeServer, SERVER_METHODS);

  return delayingCloningSecuredFakeServer;
}
