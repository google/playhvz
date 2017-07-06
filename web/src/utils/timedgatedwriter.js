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


class TimedGatedWriter extends GatedWriter {
  constructor(destination, gateOpen, timeoutMs) {
    super(destination, gateOpen);
    this.closedTimer = null;
    if (!gateOpen) {
      this.startClosedTimer();
    }
    this.timeoutMs = timeoutMs || 15000;
    this.panicObservers = [];
  }
  addPanicObserver(observer) {
    this.panicObservers.push(observer);
  }
  startClosedTimer() {
    this.clearClosedTimer();
    this.closedTimer =
        setTimeout(
            () => {
              for (let panicObserver of this.panicObservers)
                panicObserver();
            },
            this.timeoutMs);
  }
  clearClosedTimer() {
    clearTimeout(this.closedTimer);
    this.closedTimer = null;
  }
  openGate() {
    if (!this.isGateOpen()) {
      super.openGate();
      this.clearClosedTimer();
    }
  }
  closeGate() {
    if (this.isGateOpen()) {
      this.startClosedTimer();
      super.closeGate();
    }
  }
}
