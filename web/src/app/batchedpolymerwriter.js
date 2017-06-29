// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.


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
    console.log('Notifying ', notifies.length, ' times!');
    for (let notify of notifies)
      notify();
  }
}
