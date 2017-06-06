
class SimpleWriter {
  constructor(destination) {
    this.destination = destination;
  }
  batchedWrite(operations) {
    for (let operation of operations) {
      let {type, path, index, id, value} = operation;
      switch (type) {
        case 'set':
          Utils.set(this.destination, path, value);
          break;
        case 'insert':
          assert(path);
          Utils.insert(this.destination, path, index, value);
          break;
        case 'remove':
          Utils.remove(this.destination, path, index != null ? index : id);
          break;
      }
    }
  }
}
