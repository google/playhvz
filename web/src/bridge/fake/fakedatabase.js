
class FakeDatabase {
  constructor(delegate) {
    this.delegate = delegate;
    this.database = {
      games: [],
      gamesById: {},
      guns: [],
      gunsById: {},
      users: [],
      usersById: {},
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
  insert(path, index, value) {
    assert(path instanceof Array);
    assert(value && typeof value == 'object');
    assert(index === null || typeof index == 'number');
    this.delegate.broadcastOperation(
        {type: 'insert', path: path, value: Utils.copyOf(value), index: index});
    Utils.insert(this.database, path, index, Utils.copyOf(value));
  }
  remove(path, index) {
    this.delegate.broadcastOperation(
        {type: 'remove', path: path, index: index});
    Utils.remove(this.database, path, index);
  }
}
