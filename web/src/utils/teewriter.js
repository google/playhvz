
class TeeWriter {
  constructor(nearDestination, farDestination) {
    this.nearDestination = nearDestination;
    this.farDestination = farDestination;
  }
  batchedWrite(operations) {
    this.nearDestination.batchedWrite(operations);
    this.farDestination.batchedWrite(operations);
  }
}
