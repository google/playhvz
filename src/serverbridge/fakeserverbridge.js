'use strict';

// this.__proto__ = inner; is if we ever want to completely
// opt out of a layer for a certain function. like if we ever
// had a getAllGames method, we'd just completely opt it out of
// the securing layer.

function Securifier(inner, isLoggedIn, funcNames) {
  this.__proto__ = inner;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      if (!isLoggedIn()) {
        throw "Not logged in! Can't call " + funcName;
      }
      return inner[funcName](...args);
    }
  }
}

function Clonifier(inner, funcNames) {
  this.__proto__ = inner;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      return Utils.copyOf(inner[funcName](...args.map(Utils.copyOf)));
    }
  }
}

function Promisifier(inner, funcNames) {
  this.__proto__ = inner;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = inner[funcName](...args);
            setTimeout(() => resolve(result));
          } catch (error) {
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
  var innerServer = new FakeServer();
  innerServer.register(kimUserId, 'kimikimkim@kim.com');
  innerServer.register(evanUserId, 'verdagon@evan.com');
  innerServer.createGame(gameId, kimUserId);
  innerServer.joinGame(kimUserId, gameId, kimPlayerId, 'Kim the Ultimate', {});
  innerServer.joinGame(evanUserId, gameId, evanPlayerId, 'Evanpocalypse', {});
  innerServer.createChatRoom(humanChatRoom, kimPlayerId);
  innerServer.addPlayerToChatRoom(humanChatRoom, evanPlayerId);
  innerServer.addMessageToChatRoom(humanChatRoom, kimPlayerId, 'hi');
  innerServer.createChatRoom(zedChatRoom, evanPlayerId);
  innerServer.addPlayerToChatRoom(zedChatRoom, kimPlayerId);
  innerServer.addMessageToChatRoom(zedChatRoom, evanPlayerId, 'zeds rule!');
  innerServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'hoomans drool!');
  innerServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'monkeys eat stool!');
  innerServer.addMission(gameId, firstMissionId, new Date().getTime() - 1000, new Date().getTime() + 1000 * 60 * 60, "/firstgame/missions/first-mission.html");

  var loggedInUserId = null;

  const securifiedServer =
      new Securifier(
          innerServer,
          (() => !!loggedInUserId),
          subtract(SERVER_METHODS, "logIn", "register"));
  securifiedServer.logIn = function(authcode) {
    if (authcode != 'firstuserauthcode') {
      throw "Couldnt find auth code";
    }
    var userId = kimUserId;
    // To check it exists. this.__proto__ to skip the security check
    innerServer.getUserById(userId);
    loggedInUserId = userId;
    return userId;
  };
  securifiedServer.getUserById = function(userId) {
    if (loggedInUserId != userId)
      throw 'Cant get other user';
    return innerServer.getUserById(userId);
  };

  const clonifiedSecurifiedServer =
      new Clonifier(securifiedServer, SERVER_METHODS);

  const promisifiedClonifiedSecurifiedServer =
      new Promisifier(clonifiedSecurifiedServer, SERVER_METHODS);

  return promisifiedClonifiedSecurifiedServer;
}
