
class PlainWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    Utils.set(this.destination, path, Utils.copyOf(value));
  }
  insert(path, index, value) {
    Utils.insert(this.destination, path, index, Utils.copyOf(value));
  }
  remove(path, index) {
    Utils.remove(this.destination, path, index);
  }
}
