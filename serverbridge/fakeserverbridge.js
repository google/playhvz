'use strict';

function makeFakePrepopulatedServerBridge() {
  var server = new FakeServer();
  server.register('kimuserid', 'kimikimkim@kim.com');
  server.register('evanuserid', 'verdagon@evan.com');
  server.createGame('thegameid', 'kimuserid');
  server.joinGame('kimuserid', 'thegameid', 'kimplayerid', 'Kim the Ultimate');
  server.joinGame('evanuserid', 'thegameid', 'evanplayerid', 'Evanpocalypse');
  server.createChatRoom('humanchatroom', 'kimplayerid');
  server.addPlayerToChatRoom('humanchatroom', 'evanplayerid');
  return new FakeServerBridge(server);
}

// This is a class that wraps FakeServer, makes it asynchronous (all the
// methods of this class return promises), and does some checking to
// make sure the user is logged in.
function FakeServerBridge(server) {
    this.loggedInUserId = null;
    this.inner = server;
}

FakeServerBridge.delayed_ = function(callbackThatReturnsAPromise) {
  return function() {
    var args = arguments;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        callbackThatReturnsAPromise.apply(this, args).then(
            (value) => setTimeout(() => resolve(value), 100),
            (value) => setTimeout(() => reject(value), 100));
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
    FakeServerBridge.delayed_(
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
    FakeServerBridge.delayed_(
        function(userId, userEmail) {
          try {
            return Promise.resolve(this.inner.register(userId, userEmail));
          } catch (errorString) {
            return Promise.reject(errorString);
          }
        });
FakeServerBridge.prototype.getUserById =
    FakeServerBridge.delayed_(
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
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(gameId, adminUserId) {
              try {
                return Promise.resolve(this.inner.createGame(gameId, adminUserId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getGameById =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.getGameById(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.joinGame =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(userId, gameId, playerId, name) {
              try {
                return Promise.resolve(this.inner.joinGame(userId, gameId, playerId, name));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getPlayerById =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(playerId) {
              try {
                return Promise.resolve(this.inner.getPlayerById(playerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayerIdsForGameId =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.findAllPlayerIdsForGameId(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayersForGameId =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(gameId) {
              try {
                return Promise.resolve(this.inner.findAllPlayersForGameId(gameId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findAllPlayerIdsForUserId =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(userId) {
              try {
                return Promise.resolve(this.inner.findAllPlayerIdsForUserId(userId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findPlayerIdByGameAndName =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(gameId, name) {
              try {
                return Promise.resolve(this.inner.findPlayerByGameAndName(gameId, name));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.createChatRoom =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, firstPlayerId) {
              try {
                return Promise.resolve(this.inner.createChatRoom(chatRoomId, firstPlayerId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.findMessagesForChatRoom =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, afterTime) {
              try {
                return Promise.resolve(this.inner.findMessagesForChatRoom(chatRoomId, afterTime));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.getChatRoomById =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId) {
              try {
                return Promise.resolve(this.inner.getChatRoomById(chatRoomId));
              } catch (errorString) {
                return Promise.reject(errorString);
              }
            }));
FakeServerBridge.prototype.addMessageToChatRoom =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, playerId, message) {
            try {
                return Promise.resolve(this.inner.addMessageToChatRoom(chatRoomId, playerId, message));
                } catch (errorString) {
                  return Promise.reject(errorString);
                }
            }));
FakeServerBridge.prototype.addPlayerToChatRoom =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(chatRoomId, playerId) {
            try {
                return Promise.resolve(this.inner.addPlayerToChatRoom(chatRoomId, playerId));
                } catch (errorString) {
                  return Promise.reject(errorString);
                }
            }));
FakeServerBridge.prototype.findAllChatRoomIdsForPlayer =
    FakeServerBridge.delayed_(
        FakeServerBridge.loginProtected_(
            function(playerId) {
            try {
                return Promise.resolve(this.inner.findAllChatRoomIdsForPlayer(playerId));
                } catch (errorString) {
                  return Promise.reject(errorString);
                }
            }));
