
class SimpleWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    Utils.set(this.destination, path, value);
  }
  insert(path, index, value) {
    Utils.insert(this.destination, path, index, value);
  }
  remove(path, index) {
    Utils.remove(this.destination, path, index);
  }
}
