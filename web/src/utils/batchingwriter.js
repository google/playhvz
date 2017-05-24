
class BatchingWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.destination.batchedWrite([{type: 'set', path: path, value: value}]);
  }
  insert(path, index, value) {
    this.destination.batchedWrite([{type: 'insert', path: path, index: index, value: value}]);
  }
  remove(path, index, idHint) {
    this.destination.batchedWrite([{type: 'remove', path: path, index: index, id: idHint}]);
  }
}
