
// Requirement: the generated map must point to the same exact elements, not copies

let COLLECTIONS = [
  {collection: ["games"], newMap: "gamesById", keyBy: "id"},
  {collection: ["games", null, "players"], newMap: "playersById", keyBy: "id"},
  {collection: ["games", null, "players", null, "claims"], newMap: "claimsById", keyBy: "id"},
  {collection: ["games", null, "players", null, "infections"], newMap: "infectionsById", keyBy: "id"},
  {collection: ["games", null, "players", null, "lives"], newMap: "livesById", keyBy: "id"},
  {collection: ["games", null, "rewardCategories"], newMap: "rewardCategoriesById", keyBy: "id"},
  {collection: ["games", null, "rewardCategories", null, "rewards"], newMap: "rewardsById", keyBy: "id"},
  {collection: ["chatRooms"], newMap: "chatRoomsById", keyBy: "id"},
  {collection: ["chatRooms", null, "messages"], newMap: "messagesById", keyBy: "id"},
  {collection: ["notificationCategories"], newMap: "notificationCategoriesById", keyBy: "id"},
  {collection: ["missions"], newMap: "missionsById", keyBy: "id"},
  {collection: ["guns"], newMap: "gunsById", keyBy: "id"},
  {collection: ["users"], newMap: "usersById", keyBy: "id"},
  {collection: ["chatRooms", null, "memberships"], newMap: "membershipsByUserId", keyBy: "userId"},
];

class MappingWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.mapify(value);
    if (value instanceof Array) {
      let array = value;
      this.destination.set(this.mapifyPath(path), this.arrayToMap(array));
    }
    this.destination.set(path, value);
  }
  insert(path, indexOrNull, value) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    this.mapify(value);
    this.destination.set(this.mapifyValuePath(path, value), value);
    this.destination.insert(path, indexOrNull, value);
  }
  remove(path, index) {
    this.destination.remove(path, index);
  }
  mapify(path, value) {
    if (value instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        this.mapify(path.concat([i]), value[i]);
        
        if (value[key] instanceof Array) {
          let matchingCollection = this.getMatchingCollection(path);
          if (matchingCollection) {
            value[matchingCollection.newMap] =
                this.arrayToMap(value[key], matchingCollection.keyBy);
          }
        }
      }
    } else if (typeof value == 'object') {
      for (var key in value) {
        this.mapify(path.concat([key]), value[key]);

        if (value[key] instanceof Array) {
          let matchingCollection = this.getMatchingCollection(path);
          if (matchingCollection) {
            value[matchingCollection.newMap] =
                this.arrayToMap(value[key], matchingCollection.keyBy);
          }
        }
      }
    }
    return value;
  }
  arrayToMap(array, keyName) {
    let map = {};
    for (let i = 0; i < array.length; i++) {
      let element = array[i];
      assert(element[keyName]);
      let key = element[keyName];
      map[key] = element;
    }
    return map;
  }
  getMatchingCollection(path) {
    return COLLECTIONS.find(pattern => Utils.matches(pattern, path));
  }
  mapifyPath(path) {
    let result = this.getMatchingCollection(path);
    if (result) {
      let mapPath = result.slice();
      mapPath.pop();
      mapPath.push(result.newMap);
      return mapPath;
    } else {
      return null;
    }
  }
  mapifyValuePath(path, value) {
    let mapPath = this.mapifyPath(path);
    mapPath.push(value[result.keyBy]);
    return mapPath;
  }
}
