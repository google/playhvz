function Inconsistency() {}

class ConsistencyChecker {
  constructor(source, throwInconsistency) {
    this.source = source;
    this.throwInconsistency = throwInconsistency;
  }

  get(path) {
    return this.source.get(path);
  }

  falseOrThrow() {
    if (this.throwInconsistency) {
      throw new Inconsistency();
    }
    return false;
  }

  checkConsistency() {
    for (var gunId in this.get(["gunsById"])) {
      if (!this.checkGunConsistent(gunId))
        return this.falseOrThrow();
    }
    return true;
  }

  checkGunConsistent(gunId) {
    let gun = this.get(["gunsById", gunId]);
    if (!!gun.playerId != !!gun.gameId)
      return this.falseOrThrow();
    if (gun.playerId) {
      let gameId = gun.gameId;
      if (!gameId)
        return this.falseOrThrow();
      let game = this.get(["gamesById", gameId]);
      assert(typeof game.inMemory == 'boolean');
      if (game.inMemory) {
        let player = this.get(["gamesById", gameId, "playersById", gun.playerId]);
        if (!player)
          return this.falseOrThrow();
      }
    }
    return true;
  }

  checkMissionConsistent(missionId) {
    return true;
  }

  checkClaimConsistent(chatRoomId) {
    return true;
  }

  checkLifeConsistent(chatRoomId) {
    return true;
  }

  checkMembershipConsistent(chatRoomId) {
    return true;
  }

  checkMessageConsistent(chatRoomId) {
    return true;
  }

  checkInfectionConsistent(chatRoomId) {
    return true;
  }

  checkNotificationConsistent(chatRoomId) {
    return true;
  }

  checkRewardConsistent(chatRoomId) {
    return true;
  }

  checkRewardCategoryConsistent(chatRoomId) {
    return true;
  }

  checkNotificationCategoryConsistent(chatRoomId) {
    return true;
  }

  checkChatRoomConsistent(chatRoomId) {
    return true;
  }

  checkGameConsistent(gameId) {
    return true;
  }

  checkPlayerConsistent(gameId, playerId) {
    if (!this.get(["gamesById", gameId]))
      return false;
    let player = this.get(["gamesById", gameId, "playersById", playerId]);
    if (!player)
      return this.falseOrThrow();
    let userId = player.userId;
    if (!userId)
      return this.falseOrThrow();
    if (!this.get(["usersById", userId]))
      return this.falseOrThrow();
    return true;
  }

  checkAdminConsistent(gameId, adminId) {
    let admin = this.get(["gamesById", gameId, "adminsById", adminId]);
    if (!admin)
      return this.falseOrThrow();
    let userId = admin.userId;
    if (!this.get(["usersById", userId]))
      return this.falseOrThrow();
    if (!this.get(["gamesById", gameId]))
      return this.falseOrThrow();
    return true;
  }

  checkUserConsistent(userId) {
    return true;
  }
}