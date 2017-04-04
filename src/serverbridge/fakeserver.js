'use strict';

class FakeServer {
  constructor() {
    this.fakeDatabase = new FakeDatabase();
  }
  
  register(userId, userEmail) {
    var user = new User(userId, userEmail);
    this.fakeDatabase.createUser(user);
  }
  getUserById(userId) {
    return this.fakeDatabase.getUserById(userId);
  }
  createGame(gameId, adminUserId) {
    var game = new Game(gameId, adminUserId);
    this.fakeDatabase.createGame(game);
  }
  getGameById(gameId) {
    const game = Utils.copyOf(this.fakeDatabase.getGameById(gameId));
    game.rewardCategories =
        this.fakeDatabase.findRewardCategoryIdsForGameId(gameId)
            .map(rewardCategoryId => this.getRewardCategoryById(rewardCategoryId));
    return game;
  }
  joinGame(userId, gameId, playerId, name, preferences) {
    const numExistingPlayers = this.findAllPlayersForGameId(gameId).length;
    // First player will be number 1
    const number = 1 + numExistingPlayers;
    var player = new Player(playerId, number, name, gameId, userId);
    player.preferences = Utils.copyOf(preferences);
    this.fakeDatabase.createPlayer(player);

    this.fakeDatabase.addLife(playerId, this.generateLifeCode_(player), new Date().getTime());
  }
  setPlayerProfileImageUrl(playerId, imageUrl) {
    this.fakeDatabase.setPlayerProfileImageUrl(playerId, imageUrl);
  }
  getPlayerById(playerId) {
    let player = this.fakeDatabase.getPlayerById(playerId);
    player.species = this.isHuman_(player) ? 'human' : 'zombie';
    player.rewardCategoryIds =
        this.fakeDatabase.findRewardCategoryIdsForPlayerId(playerId);
    return player;
  }
  getMultiplePlayersById(playerIds) {
    var value = {};
    for (var index in playerIds) {
      var playerId = playerIds[index];
      value[playerId] = this.fakeDatabase.getPlayerById(playerId);
    }
    return Utils.copyOf(value);
  }
  findAllPlayersForGameId(gameId) {
    return this.fakeDatabase.findAllPlayerIdsForGameId(gameId)
        .map((playerId) => this.getPlayerById(playerId));
  }
  findAllPlayerIdsForUserId(userId) {
    return this.fakeDatabase.findAllPlayerIdsForUserId(userId);
  }
  findPlayerIdByGameAndName(gameId, name) {
    this.fakeDatabase.findPlayerIdByGameAndName(gameId, name);
  }
  awardPoints(playerId, points) {
    this.fakeDatabase.awardPoints(playerId, points);
  }
  createChatRoom(chatRoomId, firstPlayerId) {
    var chatRoom = new ChatRoom(chatRoomId);
    this.fakeDatabase.createChatRoom(chatRoom, firstPlayerId);
  }
  /*
  * Returns all messages after the given id, not including the given id.
  * To get all messages, set afterId to -1.
  */
  findMessagesForChatRoom(chatRoomId, afterId) {
    var messages = this.fakeDatabase.findMessagesForChatRoom(chatRoomId);
    var results = [];
    var startIndex = afterId < 0 ? 0 : afterId + 1;
    for (var i = startIndex; i < messages.length; i++) {
      var message = messages[i];
      message.id = i;
      results.push(message);
    }
    return results;
  }
  getChatRoomById(chatRoomId) {
    var chatRoom = this.fakeDatabase.getChatRoomById(chatRoomId);
    for (var i = 0; i < chatRoom.messages.length; i++) {
      chatRoom.messages[i].id = i;
    }
    return chatRoom;
  }
  addMessageToChatRoom(chatRoomId, playerId, message) {
    return this.fakeDatabase.addMessageToChatRoom(chatRoomId, playerId, message, new Date().getTime());
  }
  addPlayerToChatRoom(chatRoomId, playerId) {
    return this.fakeDatabase.addPlayerToChatRoom(chatRoomId, playerId);
  }
  findAllChatRoomIdsForPlayerId(playerId) {
    return this.fakeDatabase.findAllChatRoomIdsForPlayerId(playerId);
  }
  findAllPlayerIdsForChatRoomId(chatRoomId) {
    return this.fakeDatabase.findAllPlayerIdsForChatRoomId(chatRoomId);
  }
  addMission(gameId, missionId, beginTime, endTime, url) {
    var mission = new Mission(missionId, gameId, beginTime, endTime, url);
    return this.fakeDatabase.addMission(mission);
  }
  getMissionById(missionId) {
    return Utils.copyOf(this.fakeDatabase.getMissionById(missionId));
  }
  findAllMissionIdsForGameId(gameId) {
    return this.fakeDatabase.findAllMissionIdsForGameId(gameId);
  }
  findAllMissionsForPlayerId(playerId) {
    var gameId = this.getPlayerById(playerId).gameId;
    var missionIds = this.findAllMissionIdsForGameId(gameId);
    var missions = [];
    for (const missionId of missionIds) {
      missions.push(this.getMissionById(missionId));
    }
    return missions;
  }
  infect(infectorPlayerId, infecteeLifeCode) {
    const gameId = this.fakeDatabase.getPlayerById(infectorPlayerId).gameId;
    const infecteePlayerIdOrNull = this.fakeDatabase.findPlayerIdOrNullByLifeCode(gameId, infecteeLifeCode);
    if (!infecteePlayerIdOrNull) {
      throw 'Cannot infect, no human with that life code found!';
    }
    const infecteePlayerId = infecteePlayerIdOrNull;
    const infectee = this.getPlayerById(infecteePlayerId);
    if (!this.isHuman_(infectee)) {
      throw 'Cannot infect, infectee is not human!';
    }
    this.fakeDatabase.addInfection(infecteePlayerId, infectorPlayerId, new Date().getTime());
    return this.getPlayerById(infecteePlayerId);
  }
  revive(playerId) {
    let player = this.fakeDatabase.getPlayerById(playerId);
    const newLifeCode = this.generateLifeCode_(player)
    this.fakeDatabase.addLife(playerId, newLifeCode, new Date().getTime());
  }
  isHuman_(player) {
    return player.lives.length > player.infections.length;
  }
  generateLifeCode_(player) {
    return 'lifecode-' + player.number + '-' + (player.lives.length + 1);
  }
  addRewardCategory(rewardCategoryId, gameId, name, points, seed) {
    this.fakeDatabase.addRewardCategory(rewardCategoryId, gameId, name, points, seed);
  }
  addRewards(rewardCategoryId, numNewRewards) {
    var category = this.fakeDatabase.getRewardCategoryById(rewardCategoryId);
    var numExistingRewards = this.fakeDatabase.findRewardIdsForRewardCategoryId(rewardCategoryId).length;

    for (let i = 0; i < numNewRewards; i++) {
      let newRewardCode = "" + category.seed + "-random" + (numExistingRewards + i);
      let newRewardId = Utils.generateId('reward');
      this.fakeDatabase.addReward(newRewardId, rewardCategoryId, newRewardCode);
    }
  }
  addReward(rewardId, rewardCategoryId, rewardCode) {
    this.fakeDatabase.addReward(rewardId, rewardCategoryId, rewardCode);
  }
  claimReward(gameId, playerId, rewardCode) {
    const rewardIdOrNull =
        this.fakeDatabase.findRewardIdOrNullByGameIdAndRewardCode(gameId, rewardCode);
    if (rewardIdOrNull == null) {
      throw 'No reward with that code found for this game!';
    }
    const reward = this.getRewardById(rewardIdOrNull);
    if (reward.playerIdOrNull != null) {
      throw 'Reward already claimed!';
    }
    const rewardCategoryIdsAlreadyClaimedByPlayer =
        this.fakeDatabase.findRewardCategoryIdsForPlayerId(playerId);
    if (rewardCategoryIdsAlreadyClaimedByPlayer.includes(reward.rewardCategoryId)) {
      throw 'Another reward of this category already claimed!';
    }
    this.fakeDatabase.claimReward(playerId, reward.id);
    return this.getRewardCategoryById(reward.rewardCategoryId);
  }
  getRewardById(rewardId) {
    return this.fakeDatabase.getRewardById(rewardId);
  }
  findRewardsForRewardCategoryId(rewardCategoryId) {
    return this.fakeDatabase.findRewardIdsForRewardCategoryId(rewardCategoryId)
        .map(rewardId => this.getRewardById(rewardId));
  }
  getRewardCategoryById(rewardCategoryId) {
    var category =
        Utils.copyOf(this.fakeDatabase.getRewardCategoryById(rewardCategoryId));
    var rewards =
        this.fakeDatabase.findRewardIdsForRewardCategoryId(rewardCategoryId)
            .map(rewardId => this.fakeDatabase.getRewardById(rewardId));
    category.total = rewards.length;
    category.claimed =
        rewards.filter(reward => reward.playerIdOrNull != null).length;
    return category;
  }
  setRewardCategoryName(rewardCategoryId, newName) {
    this.fakeDatabase.setRewardCategoryName(rewardCategoryId, newName);
  }
  getAllGuns() {
    return this.fakeDatabase.getAllGunIds()
        .map(gunId => this.getGunById(gunId));
  }
  addGun(gunId, gunNumber) {
    this.fakeDatabase.addGun(gunId, gunNumber);
  }
  setGunPlayer(gunId, playerIdOrNull) {
    this.fakeDatabase.setGunPlayer(gunId, playerIdOrNull);
  }
  getGunById(gunId) {
    return this.fakeDatabase.getGunById(gunId);
  }
}



//   infectPlayer(killerId, victimId) {
//     this.infections.push({
//       time: new Date().getTime(),
//       killerId: killerId,
//       victimId: victimId,
//     });
//   }
//   revivePlayer(playerId) {
//     assert(playerId in this.playersById);
//     var player = this.playersById[playerId];
//     player.revives.push({
//       time: new Date().getTime(),
//     });
//   }
//   addGun(gunId) {
//     assert(!(gunId in this.gunsById));
//     this.gunsById[gunId] = {
//       id: gunId,
//       playerId: null,
//     };
//   }
//   lendGun(gunId, playerId) {
//     assert(gunId in this.gunsById);
//     assert(playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == null);
//     gun.playerId = playerId;
//   }
//   transferGun(gunId, fromplayerId, toplayerId) {
//     assert(gunId in this.gunsById);
//     assert(fromplayerId in this.playersById);
//     assert(toplayerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == fromplayerId);
//     gun.playerId = toplayerId;
//   }
//   returnGun(gunId, playerId) {
//     assert(gunId in this.gunsById);
//     assert(playerId in this.playersById);
//     var gun = this.gunsById[gunId];
//     assert(gun.playerId == fromplayerId);
//     gun.playerId = null;
//   }
// }
