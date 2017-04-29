
class TeeWriter {
  constructor(nearDestination, farDestination) {
    this.nearDestination = nearDestination;
    this.farDestination = farDestination;
  }
  set(path, value) {
    this.nearDestination.set(path, value);
    this.farDestination.set(path, value);
  }
  insert(path, index, value) {
    this.nearDestination.insert(path, index, value);
    this.farDestination.insert(path, index, value);
  }
  remove(path, index) {
    this.nearDestination.remove(path, index);
    this.farDestination.remove(path, index);
  }
}
