'use strict';

// We assumes below that the objects at these paths have an "id" property
let definitions = [
  ["gamesById", null],
  ["games", null, "playersById", null],
  ["games", null, "players", null, "claimsById", null],
  ["games", null, "players", null, "infectionsById", null],
  ["games", null, "players", null, "livesById", null],
  ["games", null, "players", null, "notificationsById", null],
  ["games", null, "rewardCategoriesById", null],
  ["games", null, "rewardCategories", null, "rewardsById", null],
  ["games", null, "groupsById", null],
  ["games", null, "chatRoomsById", null],
  ["games", null, "chatRooms", null, "messagesById", null],
  ["games", null, "notificationCategoriesById", null],
  ["games", null, "missionsById", null],
  ["gunsById", null],
  ["usersById", null],
];

let references = [
  // ["games", null, "admins", null, "id", null], We leave this out because we aren't allowed to see the definitions of users.
  // ["games", null, "players", null, "userId", null],
  // AKA "anything at here is an ID referring somewhere else"
  ["games", null, "id", null],
  ["games", null, "chatRooms", null, "gameId", null],
  ["games", null, "chatRooms", null, "groupId", null],
  ["games", null, "chatRooms", null, "id", null],
  ["games", null, "chatRooms", null, "messages", null, "id", null],
  ["games", null, "chatRooms", null, "messages", null, "playerId", null],
  ["games", null, "groups", null, "memberships", null, "id", null],
  ["games", null, "groups", null, "memberships", null, "playerId", null],
  ["games", null, "groups", null, "membershipsByPlayerId", null],
  ["games", null, "missions", null, "gameId", null],
  ["games", null, "missions", null, "groupId", null],
  ["games", null, "missions", null, "id", null],
  ["games", null, "notificationCategories", null, "gameId", null],
  ["games", null, "notificationCategories", null, "id", null],
  ["games", null, "players", null, "claims", null, "id", null],
  ["games", null, "players", null, "claims", null, "rewardCategoryId", null],
  ["games", null, "players", null, "claims", null, "rewardId", null],
  ["games", null, "players", null, "id", null],
  ["games", null, "players", null, "infections", null, "id", null],
  ["games", null, "players", null, "infections", null, "infectorId", null],
  ["games", null, "players", null, "lives", null, "id", null],
  ["games", null, "players", null, "chatRoomMemberships", null, "chatRoomId", null],
  ["games", null, "players", null, "missionMemberships", null, "missionId", null],
  ["games", null, "players", null, "notifications", null, "id", null],
  ["games", null, "players", null, "notifications", null, "notificationCategoryId", null],
  ["games", null, "rewardCategories", null, "id", null],
  ["games", null, "rewardCategories", null, "rewards", null, "id", null],
  ["games", null, "rewardCategories", null, "rewards", null, "playerId", null],
  ["guns", null, "id", null],
  //["guns", null, "gameId", null],
  //["guns", null, "playerId", null],
  ["users", null, "id", null],
  // ["users", null, "players", null, "id", null], We leave this out because we wont find the definition for the player until we deep listen the game
  // ["users", null, "players", null, "gameId", null],
];

function matchesAnyDefinition(path) {
  return !!definitions.filter(pattern => Utils.matches(pattern, path)).length;
}

function findDefinitions(path, value, callback) {
  Utils.forEachRowUnder(path, value, (wholePath, value) => {
    if (matchesAnyDefinition(wholePath)) {
      callback(wholePath, value);
    }
  });
}

function matchesAnyReference(path) {
  return !!references.filter(pattern => Utils.matches(pattern, path)).length;
}

function findReferences(path, value, callback) {
  Utils.forEachRowUnder(path, value, (wholePath) => {
    if (matchesAnyReference(wholePath)) {
      callback(wholePath);
    }
  });
}

class ConsistentWriter {
  constructor(destination) {
    assert(destination instanceof TimedGatedWriter);
    this.destination = destination;
    this.destination.addPanicObserver(this.panic_.bind(this));

    // A map of id to whether it exists yet.
    this.definedById = {};
    this.numUndefined = 0;
  }

  panic_() {
    console.log("Consistency panic! Num hanging ids:", this.numUndefined);
    for (var key in this.definedById) {
      if (this.definedById[key] === false) {
        console.log("This id is referenced, but never defined:", key);
      }
    }

    debugger; // If you get caught here, check the console.
    // It means that the database is inconsistent, or we're listening
    // to it wrong.

    console.error("Waiting for consistency for too long, screw it, opening!", this);
    this.destination.openGate();
  }

  noteReferencesAndDefinitions(path, value) {
    findDefinitions(path, value, (wholePath, value) => {
      let id = wholePath.slice(-1)[0];
      // assert(id.includes("-"));
      if (this.definedById[id] === undefined) {
        console.log("Found definition for id", id);
        this.definedById[id] = true;
      } else if (this.definedById[id] === true) {
        // Lets say we receive ["games"] and then ["games", 4, "stunTimer"]
        // We would hit this case four times:
        // ["games"]
        // ["games"]
        // ["games", 4]
        // ["games", 4, "stunTimer"]
        // So its not particularly worrying if we get here.
      } else if (this.definedById[id] === false) {
        console.log("Found definition for id", id, ", no longer hanging!");
        this.definedById[id] = true;
        assert(this.numUndefined);
        this.numUndefined--;
        if (this.numUndefined == 0) {
          console.log('Model is now consistent!');
        }
      } else {
        assert(false);
      }
    });
    findReferences(path, value, (wholePath) => {
      let id = wholePath.slice(-1)[0];
      if (id) { // Some IDs are optional, like gun's playerId
        // assert(id.includes("-"));
        assert(typeof id == 'string');
        if (this.definedById[id] === undefined) {
          this.definedById[id] = false;
          if (this.numUndefined == 0) {
            console.log('Model is now inconsistent!');
          }
          this.numUndefined++;
          console.log("Found reference to", id, ", is hanging!");
        } else {
          console.log("Found reference to", id, "already defined");
        }
      }
    });
  }

  batchedWrite(operations) {
    this.destination.closeGate();
    for (let operation of operations) {
      let {type, path, value, index} = operation;
      switch (type) {
        case 'set':
          this.noteReferencesAndDefinitions(path, value);
          break;
        case 'insert':
          this.noteReferencesAndDefinitions(path.concat([index]), value);
          break;
        case 'remove':
          assert(false);
          break;
      }
    }
    this.destination.batchedWrite(operations);
    if (this.numUndefined == 0) {
      this.destination.openGate();
    }
  }
}
