// This writer will take something like:
// {
//   missions: [mission1, mission2, etc],
//   players: [player1, player2, etc],
// }
// and put in corresponding xyzById maps, so that it's:
// {
//   missions: [mission1, mission2, etc],
//   missionsById: {'mission-344534': mission1, 'mission-754534': mission2},
//   players: [player1, player 2],
//   missionsById: {'player-234452': player1, 'player-545643': player2},
// }
// in other words, it adds a corrsponding map so its easier to look up
// something by ID.
//
// Requirement: the generated map must point to the same exact elements,
// not copies.

// We *could* structure this as a hierarchy/object for a big speedup, but
// this is more readable. Sticking with this until we need to optimize.
let MAPPINGS = [
  {pattern: ["games"], newMap: "gamesById", keyBy: "id"},
  // For example, the below will find any sourceObject.games[anyGameId].players
  // and make the corresponding sourceObject.games[thatSameGameId].playerById
  // map, indexed by the "id" key.
  {pattern: ["games", null, "players"], newMap: "playersById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "claims"], newMap: "claimsById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "infections"], newMap: "infectionsById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "lives"], newMap: "livesById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "notifications"], newMap: "notificationsById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "chatRoomMemberships"], newMap: "chatRoomMembershipsById", keyBy: "id"},
  {pattern: ["games", null, "players", null, "groupMemberships"], newMap: "groupMembershipsById", keyBy: "groupId"},
  {pattern: ["games", null, "rewardCategories"], newMap: "rewardCategoriesById", keyBy: "id"},
  {pattern: ["games", null, "rewardCategories", null, "rewards"], newMap: "rewardsById", keyBy: "id"},
  {pattern: ["games", null, "chatRooms"], newMap: "chatRoomsById", keyBy: "id"},
  {pattern: ["games", null, "chatRooms", null, "messages"], newMap: "messagesById", keyBy: "id"},
  {pattern: ["games", null, "admins"], newMap: "adminsByUserId", keyBy: "userId"},
  {pattern: ["games", null, "groups"], newMap: "groupsById", keyBy: "id"},
  {pattern: ["games", null, "groups", null, "memberships"], newMap: "membershipsByPlayerId", keyBy: "id"},
  {pattern: ["games", null, "notificationCategories"], newMap: "notificationCategoriesById", keyBy: "id"},
  {pattern: ["games", null, "missions"], newMap: "missionsById", keyBy: "id"},
  {pattern: ["guns"], newMap: "gunsById", keyBy: "id"},
  {pattern: ["users"], newMap: "usersById", keyBy: "id"},
  {pattern: ["users", null, "players"], newMap: "playersById", keyBy: "id"},
];
// Helper function to find which mapping a given path matches.
// For example, given ["games", 5, "players", 3, "claims"], it would
// find the claimsById mapping above, since it matches its pattern.
// Returns null if the given path doesnt match a mapping.
function findMapping(path) {
  return MAPPINGS.find(mapping => Utils.matches(mapping.pattern, path));
}

class MappingWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.mapify_(path, value);

    // For example if we're setting ["guns"] to [],
    // we also want to set ["gunsById"] to {}.
    if (value instanceof Array) {
      let mapPath = this.mapifyPath_(path);
      if (mapPath) {
        this.destination.set(mapPath, this.arrayToMap_(value));
      }
    }
    this.destination.set(path, value);
  }
  insert(path, indexOrNull, value) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    // If the given value has arrays itself, construct the corresponding
    // maps for those.
    this.mapify_(path.concat([indexOrNull]), value);
    // If the array we're inserting into has a corresponding map,
    // then set the element in that map.
    let mapPath = this.mapifyPath_(path);
    if (mapPath) {
      this.destination.insert(mapPath, value.id, value);
    }
    // And finally, add to the array.
    this.destination.insert(path, indexOrNull, value);
  }
  remove(path, index, id) {
    assert(id == null || typeof id == 'string');
    if (id != null) {
      let mapPath = this.mapifyPath_(path);
      this.destination.remove(mapPath, id);
    }
    this.destination.remove(path, index);
  }
  // Takes an object, looks for arrays in there, and if we have any
  // mapping for them, adds a map.
  mapify_(path, value) {
    if (typeof value == 'object') { // Catches arrays too, arrays are objects
      for (var key in value) { // If an array, key would be an index
        this.mapify_(path.concat([key]), value[key]); // RECURSION!

        let element = value[key];
        let elementPath = path.concat([key]);
        if (element instanceof Array) {
          let mapping = findMapping(elementPath);
          if (mapping) {
            value[mapping.newMap] = this.arrayToMap_(element, mapping.keyBy);
          }
        }
      }
    }
    return value;
  }
  // Makes [mission1, mission2, etc], into 
  // missionsById: {'mission-344534': mission1, 'mission-754534': mission2}
  arrayToMap_(array, keyName) {
    let map = {};
    for (let i = 0; i < array.length; i++) {
      let element = array[i];
      assert(element[keyName]);
      let key = element[keyName];
      map[key] = element;
    }
    return map;
  }
  mapifyPath_(path) {
    let result = findMapping(path);
    if (result) {
      let mapPath = path.slice();
      mapPath.pop();
      mapPath.push(result.newMap);
      return mapPath;
    } else {
      return null;
    }
  }
}
