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


class GatedWriter {
  constructor(destinationBatchedWriter, gateOpen) {
    this.destinationBatchedWriter = destinationBatchedWriter;
    this.waitingOperations = [];
    this.gateOpen = gateOpen;
  }
  batchedWrite(operations) {
    this.waitingOperations.push(...operations);
    if (this.gateOpen)
      this.send_();
  }
  openGate() {
    this.gateOpen = true;
    this.send_();
  }
  closeGate() {
    this.gateOpen = false;
  }
  isGateOpen() {
    return this.gateOpen;
  }
  send_() {
    assert(this.gateOpen);
    let operations = this.waitingOperations;
    this.waitingOperations = [];
    this.destinationBatchedWriter.batchedWrite(operations);
  }
}
