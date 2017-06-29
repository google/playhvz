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


class SimpleWriter {
  constructor(destination) {
    this.destination = destination;
  }
  batchedWrite(operations) {
    for (let operation of operations) {
      let {type, path, index, id, value} = operation;
      switch (type) {
        case 'set':
          Utils.set(this.destination, path, value);
          break;
        case 'insert':
          assert(path);
          Utils.insert(this.destination, path, index, value);
          break;
        case 'remove':
          Utils.remove(this.destination, path, index != null ? index : id);
          break;
      }
    }
  }
}
