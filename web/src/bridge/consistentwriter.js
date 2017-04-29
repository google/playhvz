'use strict';

let definitions = [
  ["games"],
  ["games", null, "players"],
  ["games", null, "players", null, "claims"],
  ["games", null, "players", null, "infections"],
  ["games", null, "players", null, "lives"],
  ["games", null, "rewardCategories"],
  ["games", null, "rewardCategories", null, "rewards"],
  ["chatRooms"],
  ["chatRooms", null, "messages"],
  ["chatRooms", null, "memberships"],
  ["notificationCategories"],
  ["missions"],
  ["guns"],
  ["users"],
  ["users", null, "players", null, "notifications", null],
];

let references = [
  // AKA "anything directly under this level is an ID referring somewhere else"
  ["chatRooms", null, "gameId"],
  ["chatRooms", null, "membershipsByUserId"],
  ["chatRooms", null, "membershipsByUserId", null],
  ["chatRooms", null, "messages", null, "playerId"],
  ["games", null, "adminUserIds"],
  ["games", null, "chatRoomIds"],
  ["games", null, "missionIds"],
  ["games", null, "notificationCategoryIds"],
  ["games", null, "players", null, "userId"],
  ["games", null, "players", null, "claims", null, "rewardCategoryId"],
  ["games", null, "players", null, "claims", null, "rewardId"],
  ["games", null, "players", null, "infections", null, "infectorId"],
  ["games", null, "rewardCategories", null, "rewards", null, "playerId"],
  ["guns", null, "gameId"],
  ["guns", null, "playerId"],
  ["missions", null, "gameId"],
  ["notificationCategories", null, "gameId"],
  ["users", null, "players", null, "gameId"],
  ["users", null, "players", null, "notifications"],
  ["users", null, "players", null, "notifications", null],
  ["users", null, "players", null, "notifications", null, null, "notificationCategoryId"],
];

function matchesAnyDefinition(path) {
  return !!definitions.filter(pattern => Utils.matches(pattern, path)).length;
}

function findDefinitions(path, value, callback) {
  Utils.forEachPathUnder(path, value, (wholePath, value) => {
    if (matchesAnyDefinition(wholePath)) {
      callback(wholePath, value);
    }
  });
}

function matchesAnyReference(path) {
  return !!references.filter(pattern => Utils.matches(pattern, path)).length;
}

function findReferences(path, value, callback) {
  Utils.forEachPathUnder(path, value, (wholePath, value) => {
    if (matchesAnyReference(wholePath)) {
      callback(wholePath, value);
    }
  });
}

class ConsistentWriter {
  constructor(destination) {
    assert(destination instanceof GatedWriter);
    this.destination = destination;

    // A map of id to whether it exists yet.
    this.definedById = {};
    this.numUndefined = 0;
  }

  noteReferencesAndDefinitions(path, value) {
    findDefinitions(path, value, (wholePath, id) => {
      assert(!this.definedById[id]);
      assert(this.numUndefined);
      this.definedById[id] = true;
      this.numUndefined--;
    });
    findReferences(path, value, (wholePath, id) => {
      if (this.definedById[id] == undefined) {
        this.definedById[id] = false;
        this.numUndefined++;
      }
    });
  }

  set(path, value) {
    this.destination.closeGate();
    this.destination.set(path, value)
    this.noteReferencesAndDefinitions(path, value);
    if (this.numUndefined == 0) {
      this.destination.openGate();
    }
  }
  insert(path, index, value) {
    this.destination.closeGate();
    this.destination.insert(path, index, value);
    this.noteReferencesAndDefinitions(path, value);
    if (this.numUndefined == 0) {
      this.destination.openGate();
    }
  }
  remove(path, index) {
    assert(false); // implement
    //this.destination.remove(path, index, value);
  }
}
