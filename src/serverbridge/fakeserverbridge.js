'use strict';

function makeFakePrepopulatedServerBridge() {
  var kimUserId = Utils.generateId("user");
  var evanUserId = Utils.generateId("user");
  var kimPlayerId = Utils.generateId("player");
  var evanPlayerId = Utils.generateId("player");
  var gameId = Utils.generateId("game");
  var humanChatRoom = Utils.generateId("chat");
  var zedChatRoom = Utils.generateId("chat");
  var firstMissionId = Utils.generateId("mission");
  var server = new FakeServer();
  server.register(kimUserId, 'kimikimkim@kim.com');
  server.register(evanUserId, 'verdagon@evan.com');
  server.createGame(gameId, kimUserId);
  server.joinGame(kimUserId, gameId, kimPlayerId, 'Kim the Ultimate', {});
  server.joinGame(evanUserId, gameId, evanPlayerId, 'Evanpocalypse', {});
  server.createChatRoom(humanChatRoom, kimPlayerId);
  server.addPlayerToChatRoom(humanChatRoom, evanPlayerId);
  server.addMessageToChatRoom(humanChatRoom, kimPlayerId, 'hi');
  server.createChatRoom(zedChatRoom, evanPlayerId);
  server.addPlayerToChatRoom(zedChatRoom, kimPlayerId);
  server.addMessageToChatRoom(zedChatRoom, evanPlayerId, 'zeds rule!');
  server.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'hoomans drool!');
  server.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'monkeys eat stool!');
  server.addMission(gameId, firstMissionId, new Date().getTime() - 1000, new Date().getTime() + 1000 * 60 * 60, "/firstgame/missions/first-mission.html");
  return new FakeServerBridge(server, evanUserId);
}

// This is a class that wraps FakeServer, makes it asynchronous (all the
// methods of this class return promises), and does some checking to
// make sure the user is logged in.
function FakeServerBridge(server, fakeLoggedInUserId) {
  this.fakeLoggedInUserId = fakeLoggedInUserId;
  this.loggedInUserId = null;
  this.inner = server;
}

FakeServerBridge.fakeServerMethod_ = function(callbackThatReturnsAPromise) {
  return function() {
    var args = arguments;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        callbackThatReturnsAPromise.apply(this, args).then(
            (value) => setTimeout(() => resolve(value && JSON.parse(JSON.stringify(value))), 100),
            (value) => setTimeout(() => reject(value && JSON.parse(JSON.stringify(value))), 100));
      }, 100);
    });
  }
}

FakeServerBridge.loginProtected_ = function(callbackThatReturnsAPromise) {
  return function() {
    var args = arguments;
    if (this.loggedInUserId) {
      return callbackThatReturnsAPromise.apply(this, args);
    } else {
      return Promise.reject('Not logged in');
    }
  }
}

FakeServerBridge.prototype.logIn =
    FakeServerBridge.fakeServerMethod_(
        function(authcode) {
          try {
            var userId = authcode.slice('authcodefor'.length);
            // To check it exists
            this.inner.getUserById(userId);
            this.loggedInUserId = userId;
            return Promise.resolve(userId);
          } catch (errorString) {
            return Promise.reject(errorString);
          }
        });
FakeServerBridge.prototype.register =
    FakeServerBridge.fakeServerMethod_(
        function(userId, userEmail) {
          try {
            return Promise.resolve(this.inner.register(userId, userEmail));
          } catch (errorString) {
            return Promise.reject(errorString);
          }
        });
FakeServerBridge.prototype.getUserById =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(userId) {
              try {
                if (this.loggedInUserId != userId)
                  throw 'Cant get other user';
                return Promise.resolve(this.inner.getUserById(userId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.createGame =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId, adminUserId) {
              try {
                return Promise.resolve(this.inner.createGame(gameId, adminUserId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getGameById =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.getGameById(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.joinGame =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(userId, gameId, playerId, name, preferences) {
              try {
                return Promise.resolve(this.inner.joinGame(userId, gameId, playerId, name, preferences));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getPlayerById =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(playerId) {
              try {
                return Promise.resolve(this.inner.getPlayerById(playerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getMultiplePlayersById =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(playerIds) {
              try {
                return Promise.resolve(this.inner.getMultiplePlayersById(playerIds));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayerIdsForGameId =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.findAllPlayerIdsForGameId(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayersForGameId =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.findAllPlayersForGameId(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayerIdsForUserId =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(userId) {
              try {
                return Promise.resolve(this.inner.findAllPlayerIdsForUserId(userId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findPlayerIdByGameAndName =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId, name) {
              try {
                return Promise.resolve(this.inner.findPlayerByGameAndName(gameId, name));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.createChatRoom =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, firstPlayerId) {
              try {
                return Promise.resolve(this.inner.createChatRoom(chatRoomId, firstPlayerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findMessagesForChatRoom =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, afterTime) {
              try {
                return Promise.resolve(this.inner.findMessagesForChatRoom(chatRoomId, afterTime));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getChatRoomById =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId) {
              try {
                return Promise.resolve(this.inner.getChatRoomById(chatRoomId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.addMessageToChatRoom =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, playerId, message) {
              try {
                return Promise.resolve(this.inner.addMessageToChatRoom(chatRoomId, playerId, message));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.addPlayerToChatRoom =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, playerId) {
              try {
                return Promise.resolve(this.inner.addPlayerToChatRoom(chatRoomId, playerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllChatRoomIdsForPlayerId =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(playerId) {
              try {
                return Promise.resolve(this.inner.findAllChatRoomIdsForPlayerId(playerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.addMission =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(gameId, missionId, beginTime, endTime, url) {
              try {
                return Promise.resolve(this.inner.addMission(gameId, missionId, beginTime, endTime, url));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllMissionsForPlayerId =
    FakeServerBridge.fakeServerMethod_(
        FakeServerBridge.loginProtected_(
            function(playerId) {
              try {
                return Promise.resolve(this.inner.findAllMissionsForPlayerId(playerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
