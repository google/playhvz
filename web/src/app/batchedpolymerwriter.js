
class BatchedPolymerWriter {
  constructor(component, propertyName) {
    this.component = component;
    this.propertyName = propertyName;
  }
  batchedWrite(operations) {
    let notifies = [];
    let property = this.component.get(this.propertyName);
    for (let operation of operations) {
      let {type, path, value, id, index} = operation;
      let targetPath = this.propertyName + '.' + path.join(".");
      switch (type) {
        case 'set':
          Utils.set(property, path, value);
          notifies.push(() => this.component.notifyPath(targetPath, value));
          break;
        case 'insert':
          let array = Utils.get(property, path);
          index = index === null ? array.length : index;
          Utils.insert(property, path, index, value);
          notifies.push(() => {
            this.component.notifySplices(targetPath, [
                {
                  index: index,
                  removed: [],
                  addedCount: 1,
                  object: array,
                  type: 'splice'
                }]);
          });
          break;
        case 'remove':
          let obj = Utils.get(property, path);
          if (obj instanceof Array) {
            let removed = obj[index];
            notifies.push(() => {
              this.component.notifySplices(targetPath, [
                  {
                    index: index,
                    removed: [removed],
                    addedCount: 0,
                    object: obj,
                    type: 'splice',
                  }]);
            });
          } else {
            assert(typeof obj == 'object');
            notifies.push(() => {
              this.component.notifyPath(targetPath + "." + index, null);
            });
          }
          Utils.remove(property, path, index != null ? index : id);
          break;
        default:
          throwError('Unknown operation:', operation);
      }
    }
    for (let notify of notifies)
      notify();
  }
}
