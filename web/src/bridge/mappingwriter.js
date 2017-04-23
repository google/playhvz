
class MappingWriter {
  constructor(destination) {
    this.destination = destination;
  }
  set(path, value) {
    this.destination.set(path, value);
  }
  insert(path, indexOrNull, value) {
    assert(path instanceof Array);
    assert(typeof value == 'object');
    assert(path);
    assert(value);
    assert(indexOrNull == null || typeof indexOrNull == 'number');
    for (var key in value) {
      if (value[key] instanceof Array) {
        let list = value[key];
        let map = {};
        for (var elementKey in list) {
          let element = list[elementKey];
          assert(element.id);
          map[element.id] = element;
        }
        value[key + "ById"] = map;
      }
    }
    this.destination.insert(path, indexOrNull, value);
    let mapPath = path.slice();
    mapPath[mapPath.length - 1] += "ById";
    let pathInMap = mapPath.concat([value.id]);
    this.destination.set(pathInMap, value);
  }
  remove(path) {
    this.destination.remove(path);
  }
}
