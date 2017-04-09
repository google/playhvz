
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
    return Utils.copyOf(this.innerGet_(this.database, path));
  }
  innerGet_(obj, path) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      return obj[path[0]];
    } else {
      return this.innerGet_(obj[path[0]], path.slice(1));
    }
  }
  set(path, value) {
    this.broadcastOperation_({
      type: 'set',
      path: path,
      value: Utils.copyOf(value),
    });
    this.innerSet_(this.database, path, Utils.copyOf(value));

    // if (this.gameId && path[0] == "games" && path[1] == this.getGameIndex(this.gameId)) {
    //   this.set_(["game"].concat(path.slice(2)), value);
    // }
  }
  innerSet_(obj, path, value) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]] = value;
    } else {
      this.innerSet_(obj[path[0]], path.slice(1), value);
    }
  }
  push(path, value) {
    this.broadcastOperation_({
      type: 'push',
      path: path,
      value: Utils.copyOf(value),
    });
    this.innerPush_(this.database, path, Utils.copyOf(value));
  }
  innerPush_(obj, path, value) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]].push(value);
    } else {
      this.innerPush_(obj[path[0]], path.slice(1), value);
    }
  }
  remove(path, index) {
    this.broadcastOperation_({
      type: 'remove',
      path: path,
      index: index,
    });
    this.innerRemove_(this.database, path, index);
  }
  innerRemove_(obj, path, index) {
    if (!path || !path.length) {
      throwError('no path!');
    } else if (path.length == 1) {
      obj[path[0]].splice(index, 1);
    } else {
      this.innerRemove_(obj[path[0]], path.slice(1), index);
    }
  }
  broadcastOperation_(operation) {
    //console.log("Broadcasting:", operation);
    this.delegate.broadcastOperation(operation);
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
