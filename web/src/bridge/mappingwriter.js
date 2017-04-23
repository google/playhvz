
class MappingWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.mapify(value);
    if (value instanceof Array) {
      let array = value;
      this.destination.set(this.mapifyPath(path), this.arrayToMap(array));
    }
    this.destination.set(path, value);
  }
  insert(path, indexOrNull, value) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    this.mapify(value);
    let pathInMap = this.mapifyPath(path).concat([value.id]);
    this.destination.set(pathInMap, value);
    this.destination.insert(path, indexOrNull, value);
  }
  remove(path, index) {
    this.destination.remove(path, index);
  }
  mapify(value) {
    if (value instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        this.mapify(value[i]);
      }
    } else if (typeof value == 'object') {
      for (var key in value) {
        this.mapify(value[key]);
        if (value[key] instanceof Array) {
          value[key + "ById"] = this.arrayToMap(value[key]);;
        }
      }
    }
    return value;
  }
  arrayToMap(array) {
    let map = {};
    for (let i = 0; i < array.length; i++) {
      let element = array[i];
      assert(element.id);
      map[element.id] = element;
    }
    return map;
  }
  mapifyPath(path) {
    let mapPath = path.slice();
    mapPath[mapPath.length - 1] += "ById";
    return mapPath;
  }
}
