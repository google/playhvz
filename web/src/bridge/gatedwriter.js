
class GatedWriter {
  constructor(destination, gateOpen) {
    this.destination = destination;
    this.waitingOperations = [];
    this.gateOpen = this.gateOpen;
  }
  set(path, value) {
    this.waitingOperations.push(
        {type: 'set', path: path, value: Utils.copyOf(value)});
    if (this.gateOpen)
      this.send_();
  }
  insert(path, index, value) {
    this.waitingOperations.push(
        {type: 'insert', path: path, value: Utils.copyOf(value), index: index});
    if (this.gateOpen)
      this.send_();
  }
  remove(path, index) {
    this.waitingOperations.push(
        {type: 'remove', path: path, index: index});
    if (this.gateOpen)
      this.send_();
  }
  openGate() {
    this.gateOpen = true;
    this.send_();
  }
  closeGate() {
    this.gateOpen = false;
  }
  isGateOpen() { return this.gateOpen; }
  send_() {
    assert(gateOpen);
    for (let operation of this.waitingOperations) {
      let {type, path, value, index} = operation;
      switch (type) {
        case 'set': this.localDb.set(path, value); break;
        case 'insert': this.localDb.insert(path, index, value); break;
        case 'remove': this.localDb.remove(path); break;
        default: throwError('Unknown operation:', operation);
      }
    }
  }
}
