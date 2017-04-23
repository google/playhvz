
class BatchedPolymerWriter {
  constructor(component, propertyName) {
    this.component = component;
    this.propertyName = propertyName;
  }
  batchedWrite(operations) {
    let property = this.component.get(this.propertyName);
    for (let operation of operations) {
      let {type, path, value, index} = operation;
      let targetPath = this.propertyName + '.' + path.join(".");
      switch (type) {
        case 'set':
          Utils.set(property, path, value);
          break;
        case 'insert':
          Utils.insert(property, path, index, value);
          break;
        case 'remove':
          Utils.remove(property, path, index);
          break;
        default:
          throwError('Unknown operation:', operation);
      }
    }
    for (let operation of operations) {
      let {type, path, value, index} = operation;
      let targetPath = this.propertyName + '.' + path.join(".");
      switch (type) {
        case 'set':
          this.component.notifyPath(targetPath, value);
          break;
        case 'insert':
          let array = Utils.get(property, path);
          this.component.notifySplices(targetPath, [
              {
                index: index === null ? array.length : index,
                removed: [],
                addedCount: 1,
                object: array,
                type: 'splice'
              }]);
          break;
        case 'remove':
          assert(false); // implement
          // will need to remember the removed items, so we can give
          // to notifySplices
          break;
        default:
          throwError('Unknown operation:', operation);
      }
    }
  }
}
