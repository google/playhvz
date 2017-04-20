
class FakeDatabase {
  constructor(delegate) {
    this.delegate = delegate;
    this.database = {
      games: [],
      guns: [],
      users: [],
    };

    window.fakeDatabase = this;
  }
  get(path) {
    return Utils.copyOf(Utils.get(this.database, path));
  }
  set(path, value) {
    this.delegate.broadcastOperation(
        {type: 'set', path: path, value: Utils.copyOf(value)});
    Utils.set(this.database, path, Utils.copyOf(value));
  }
  push(path, value) {
    this.delegate.broadcastOperation(
        {type: 'push', path: path, value: Utils.copyOf(value)});
    Utils.push(this.database, path, Utils.copyOf(value));
  }
  remove(path, index) {
    this.delegate.broadcastOperation(
        {type: 'remove', path: path, index: index});
    Utils.remove(this.database, path, index);
  }
  objForId(id, allowNotFound) {
    assert(id);
    let result = this.objForIdInner_(this.database, id);
    if (!allowNotFound)
      assert(result);
    return result;
  }
  objForIdInner_(obj, id) {
    assert(typeof obj == 'object');
    if (obj) {
      if (obj.id == id)
        return obj;
      for (var key in obj) {
        if (typeof obj[key] == 'object') {
          let found = this.objForIdInner_(obj[key], id);
          if (found)
            return found;
        }
      }
    }
    return null;
  }
  pathForId(id, allowNotFound) {
    assert(id);
    let result = this.pathForIdInner_([], this.database, id);
    if (!allowNotFound)
      assert(result);
    return result;
  }
  pathForIdInner_(path, obj, id) {
    assert(typeof obj == 'object');
    if (obj) {
      if (obj.id == id)
        return path;
      for (var key in obj) {
        if (typeof obj[key] == 'object') {
          let foundPath = this.pathForIdInner_(path.concat([key]), obj[key], id);
          if (foundPath)
            return foundPath;
        }
      }
    }
    return null;
  }
}
