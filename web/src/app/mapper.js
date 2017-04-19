
class Mapper {
  constructor(delegate) {
    this.delegate = delegate;
  }
  set(path, value) {
    assert(typeof value != 'object');
    this.delegate.set(path, value);
  }
  addEmptyMaps(object, listNames) {
    for (let listName of listNames) {
      assert(object[listName] instanceof Array);
      object[listName + "ById"] = {};
    }
  }
  insert(path, value, indexOrNull) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    for (var key in value) {
      if (value[key] instanceof Array) {
        assert(value[key].length == 0); // curiosity
        value[key + "ById"] = {};
      }
    }
    this.delegate.insert(path, value, indexOrNull);
    let mapPath = path.slice();
    mapPath[mapPath.length - 1] += "ById";
    let pathInMap = mapPath.concat([value.id]);
    this.delegate.set(pathInMap, value);
  }
  get(path) {
    return this.delegate.get(path);
  }
  onUserSignedIn(userId) {
    this.delegate.onUserSignedIn(userId);
  }
  onAutoSignInFailed() {
    this.delegate.onAutoSignInFailed();
  }
}
