
class GatedWriter {
  constructor(destinationBatchedWriter, gateOpen) {
    this.destinationBatchedWriter = destinationBatchedWriter;
    this.waitingOperations = [];
    this.gateOpen = gateOpen;
  }
  batchedWrite(operations) {
    this.waitingOperations.push(...operations);
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
