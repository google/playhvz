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


class TeeWriter {
  constructor(...destinations) {
    this.destinations = destinations.slice();
  }
  addDestination(destination) {
    this.destinations.push(destination);
  }
  removeDestination(destination) {
    let index = this.destinations.indexOf(destination);
    assert(index >= 0);
    this.destinations.splice(index, 1);
  }
  batchedWrite(operations) {
    for (let destination of this.destinations) {
      destination.batchedWrite(operations);
    }
  }
}
