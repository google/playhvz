
class CloningWriter {
  constructor(destination) {
    this.destination = destination;
  }
  batchedWrite(operations) {

    // We really just needed to clone the values, but eh, lets clone
    // the entire array.
    this.destination.batchedWrite(Utils.copyOf(operations));
  }
}
