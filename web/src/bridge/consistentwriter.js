// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.

'use strict';

// We assumes below that the objects at these paths have an "id" property
let definitions = [
  ["playersById", null],
  ["gunsById", null],
  ["players", null, "private", "id", null],
  ["players", null, "claimsById", null],
  ["players", null, "infectionsById", null],
  ["players", null, "livesById", null],
  ["players", null, "lives", "private", "id", null],
  ["players", null, "private", "notificationsById", null],
  ["rewardCategoriesById", null],
  ["rewardCategories", null, "rewardsById", null],
  ["groupsById", null],
  ["chatRoomsById", null],
  ["chatRooms", null, "messagesById", null],
  ["queuedNotificationsById", null],
  ["missionsById", null],
];

let references = [
  // AKA "anything at here is an ID referring somewhere else"
  ["chatRooms", null, "groupId", null],
  ["chatRooms", null, "id", null],
  ["chatRooms", null, "messages", null, "id", null],
  ["chatRooms", null, "messages", null, "playerId", null],
  ["groups", null, "players", null, null],
  ["groups", null, "playersById", null],
  ["groups", null, "membershipsByPlayerId", null],
  ["missions", null, "groupId", null],
  ["missions", null, "id", null],
  ["queuedNotifications", null, "id", null],
  ["players", null, "claims", null, "id", null],
  ["players", null, "claims", null, "rewardCategoryId", null],
  ["players", null, "claims", null, "rewardId", null],
  ["players", null, "id", null],
  ["players", null, "infections", null, "id", null],
  ["players", null, "infections", null, "infectorId", null],
  ["players", null, "lives", null, "id", null],
  ["players", null, "private", "chatRoomMemberships", null, "chatRoomId", null],
  ["players", null, "private", "missionMemberships", null, "missionId", null],
  ["players", null, "private", "notifications", null, "id", null],
  ["rewardCategories", null, "id", null],
  ["rewardCategories", null, "rewards", null, "id", null],
  ["rewardCategories", null, "rewards", null, "playerId", null],
  ["guns", null, "id", null],
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

  removeDefinitions(path, value) {
    findDefinitions(path, value, (wholePath, value) => {
      let id = wholePath.slice(-1)[0];
      if (this.definedById[id] === undefined) {
        // do nothing
      } else if (this.definedById[id] === true) {
        delete this.definedById[id];
      } else if (this.definedById[id] === false) {
        delete this.definedById[id];
      } else {
        assert(false);
      }

    });
  }

  noteReferencesAndDefinitions(path, value) {
    findDefinitions(path, value, (wholePath, value) => {
      let id = wholePath.slice(-1)[0];
      // assert(id.includes("-"));
      if (this.definedById[id] === undefined) {
        // console.log("Found definition for id", id);
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
        // console.log("Found definition for id", id, ", no longer hanging!");
        this.definedById[id] = true;
        assert(this.numUndefined);
        this.numUndefined--;
        if (this.numUndefined == 0) {
          // console.log('Model is now consistent!');
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
            // console.log('Model is now inconsistent!');
          }
          this.numUndefined++;
          // console.log("Found reference to", id, ", is hanging!");
        } else {
          // console.log("Found reference to", id, "already defined");
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
          this.removeDefinitions(path.concat([index]));
          break;
      }
    }
    this.destination.batchedWrite(operations);
    if (this.numUndefined == 0) {
      this.destination.openGate();
    }
  }
}
