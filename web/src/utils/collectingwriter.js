
class CollectingWriter {
  constructor(destination) {
    this.destination = destination;
    this.waitingOperations_ = [];
  }
  batchedWrite(operations) {
    this.destination.batchedWrite(operations);
    // this.waitingOperations_ = this.waitingOperations_.concat(operations);
    // setTimeout(() => this.flush(), 0);
  }
  flush() {
    if (this.waitingOperations_.length) {
      console.log('Writing ' + this.waitingOperations_.length);
      let operations = this.waitingOperations_;
      this.waitingOperations_ = [];
      this.destination.batchedWrite(operations);
    }
  }
}
