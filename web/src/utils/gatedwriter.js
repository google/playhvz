
class GatedWriter {
  constructor(destinationBatchedWriter, gateOpen) {
    this.destinationBatchedWriter = destinationBatchedWriter;
    this.waitingOperations = [];
    this.gateOpen = gateOpen;
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
  isGateOpen() {
    return this.gateOpen;
  }
  send_() {
    assert(this.gateOpen);
    let operations = this.waitingOperations;
    this.waitingOperations = [];
    this.destinationBatchedWriter.batchedWrite(operations);
  }
}
