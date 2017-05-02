
class CloningWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.destination.set(path, Utils.copyOf(value));
  }
  insert(path, index, value) {
    this.destination.insert(path, index, Utils.copyOf(value));
  }
  remove(path, index, idHint) {
    this.destination.remove(path, index, idHint);
  }
}
