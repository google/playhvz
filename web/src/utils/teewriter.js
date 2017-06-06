
class TeeWriter {
  constructor(...destinations) {
    this.destinations = destinations.slice();
  }
  addDestination(destination) {
    this.destinations.push(destination);
  }
  removeDestination(destination) {
    let index = this.destinations.indexOf(destination);
    assert(index >= 0);
    this.destinations.splice(index, 1);
  }
  batchedWrite(operations) {
    for (let destination of this.destinations) {
      destination.batchedWrite(operations);
    }
  }
}
