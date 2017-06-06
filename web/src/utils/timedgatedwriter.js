
class TimedGatedWriter extends GatedWriter {
  constructor(destination, gateOpen, timeoutMs) {
    super(destination, gateOpen);
    this.closedTimer = null;
    if (!gateOpen) {
      this.startClosedTimer();
    }
    this.timeoutMs = timeoutMs || 5000;
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
