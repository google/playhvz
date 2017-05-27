
class ObservableWriter {
  constructor(destination, ...observers) {
    this.destination = destination;

    this.observers = [];
    for (let observer of observers)
      this.addObserver(observer);
  }
  addObserver(observer) {
    this.observers.push(observer);
  }
  batchedWrite(operations) {
    for (let observer of this.observers) {
      for (let operation of operations) {
        observer(operation);
      }
    }
    this.destination.batchedWrite(operations);
  }
}

