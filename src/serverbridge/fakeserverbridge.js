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
function FakeServerBridge(server, firstUserId) {
  var loggedInUserId = null;

  this.fakeServerCall_ = (loginProtected, method) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (loginProtected && !loggedInUserId) {
            throw "Not logged in!";
          }
          let successResult = method();
          setTimeout(() => resolve(Utils.copyOf(successResult)), 100);
        } catch (error) {
          console.error(error);
          setTimeout(() => reject(Utils.copyOf(error)), 100);
        }
      }, 100);
    });
  };

  this.logIn = (authcode) => {
    return this.fakeServerCall_(false, () => {
      if (authcode != 'firstuserauthcode') {
        throw "Couldnt find auth code";
      }
      var userId = firstUserId;
      // To check it exists
      server.getUserById(userId);
      loggedInUserId = userId;
      return userId;
    });
  };

  this.register = () => {
    var args = arguments;
    return this.fakeServerCall_(false, () => server.register.apply(server, arguments));
  };

  this.getUserById = (userId) => {
    return this.fakeServerCall_(false, () => {
      if (loggedInUserId != userId)
        throw 'Cant get other user';
      return server.getUserById(userId);
    });
  }

  var restOfMethods = [
    'createGame',
    'getGameById',
    'joinGame',
    'findAllPlayerIdsForGameId',
    'findAllPlayerIdsForUserId',
    'findPlayerByGameAndName',
    'createChatRoom',
    'findMessagesForChatRoom',
    'getChatRoomById',
    'addMessageToChatRoom',
    'addPlayerToChatRoom',
    'findAllChatRoomIdsForPlayerId',
    'addMission',
    'getPlayerById',
    'findAllPlayersForGameId',
    'findAllMissionsForPlayerId',
    'getMultiplePlayersById',
  ];
  for (var method of restOfMethods) {
    ((method) => {
      this[method] = function() {
        var args = arguments;
        return this.fakeServerCall_(true, () => server[method].apply(server, args));
      };
    })(method);
  }
}
