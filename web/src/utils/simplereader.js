
class SimpleReader {
  constructor(source) {
    this.source = source;
  }
  get(path) {
    return Utils.get(this.source, path);
  }
}
