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
class FakeServerBridge {
  constructor(server, fakeLoggedInUserId) {
    this.fakeLoggedInUserId = fakeLoggedInUserId;
    this.loggedInUserId = null;
    this.inner = server;
  }

  logIn(authcode) {
    return this.fakeServerCall_(false, [], () => {
      var userId = authcode.slice('authcodefor'.length);
      // To check it exists
      this.inner.getUserById(userId);
      this.loggedInUserId = userId;
      return userId;
    });
  }
  register() { return this.fakeServerCall_(false, arguments, 'register'); }
  getUserById() {
    return this.fakeServerCall_(false, arguments, () => {
      if (this.loggedInUserId != userId)
        throw 'Cant get other user';
      return this.inner.getUserById.apply(this.inner, arguments);
    });
  }
  createGame() { return this.fakeServerCall_(true, arguments, 'createGame'); }
  joinGame() { return this.fakeServerCall_(true, arguments, 'joinGame'); }
  findAllPlayerIdsForGameId() { return this.fakeServerCall_(true, arguments, 'findAllPlayerIdsForGameId'); }
  findAllPlayerIdsForUserId() { return this.fakeServerCall_(true, arguments, 'findAllPlayerIdsForUserId'); }
  findPlayerByGameAndName() { return this.fakeServerCall_(true, arguments, 'findPlayerByGameAndName'); }
  createChatRoom() { return this.fakeServerCall_(true, arguments, 'createChatRoom'); }
  findMessagesForChatRoom() { return this.fakeServerCall_(true, arguments, 'findMessagesForChatRoom'); }
  getChatRoomById() { return this.fakeServerCall_(true, arguments, 'getChatRoomById'); }
  addMessageToChatRoom() { return this.fakeServerCall_(true, arguments, 'addMessageToChatRoom'); }
  addPlayerToChatRoom() { return this.fakeServerCall_(true, arguments, 'addPlayerToChatRoom'); }
  findAllChatRoomIdsForPlayerId() { return this.fakeServerCall_(true, arguments, 'findAllChatRoomIdsForPlayerId'); }
  addMission() { return this.fakeServerCall_(true, arguments, 'addMission'); }
  getPlayerById() { return this.fakeServerCall_(true, arguments, 'getPlayerById'); }
  findAllPlayersForGameId() { return this.fakeServerCall_(true, arguments, 'findAllPlayersForGameId'); }
  findAllMissionsForPlayerId() { return this.fakeServerCall_(true, arguments, 'findAllMissionsForPlayerId'); }
  getMultiplePlayersById() { return this.fakeServerCall_(true, arguments, 'getMultiplePlayersById'); }

  fakeServerCall_(loginProtected, args, method) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (loginProtected && !this.loggedInUserId) {
            throw "Not logged in!";
          }
          let successResult;
          if (typeof method == 'string') {
            successResult = this.inner[method].apply(this.inner, args);
          } else {
            successResult = method.apply(this, args);
          }
          setTimeout(() => resolve(Utils.copyOf(successResult)), 100);
        } catch (error) {
          console.error(error);
          setTimeout(() => reject(Utils.copyOf(error)), 100);
        }
      }, 100);
    });
  }
}