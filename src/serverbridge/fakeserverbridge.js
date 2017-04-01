'use strict';

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

function Clonifier(inner, funcNames) {
  this.__proto__ = inner;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      return Utils.copyOf(inner[funcName](...args.map(Utils.copyOf)));
    }
  }
}

function Protectifier(inner, isLoggedIn, funcNames) {
  this.__proto__ = inner;
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      if (!isLoggedIn()) {
        throw "Not logged in! Can't call " + funcName;
      }
      return inner[funcName];
    }
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


  innerServer.logIn = function(authcode) {
    if (authcode != 'firstuserauthcode') {
      throw "Couldnt find auth code";
    }
    var userId = kimUserId;
    // To check it exists. this.__proto__ to skip the security check
    this.__proto__.getUserById.call(this, userId);
    loggedInUserId = userId;
    return userId;
  };

  innerServer.getUserById = function(userId) {
    if (loggedInUserId != userId)
      throw 'Cant get other user';
    return this.__proto__.getUserById.call(this, userId);
  };

  const clonifiedServer =
      new Clonifier(innerServer, SERVER_METHODS);

  const promisifiedClonifiedServer =
      new Promisifier(clonifiedServer, SERVER_METHODS);

  const protectifiedClonifiedPromisifiedServer =
      new Protectifier(
          promisifiedClonifiedServer,
          (() => !!loggedInUserId),
          subtract(SERVER_METHODS, "logIn", "register"));

  return protectifiedClonifiedPromisifiedServer;
}
