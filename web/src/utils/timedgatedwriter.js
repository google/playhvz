
class TimedGatedWriter extends GatedWriter {
  constructor(destination, gateOpen, timeoutMs) {
    super(destination, gateOpen);
    this.closedTimer = null;
    if (!gateOpen) {
      this.startClosedTimer();
    }
    this.timeoutMs = timeoutMs || 2000;
  }
  startClosedTimer() {
    this.closedTimer =
        setTimeout(
            () => console.error("Gate closed for too long!", this),
            this.timeoutMs);
  }
  openGate() {
    if (!this.isGateOpen()) {
      console.log("Opening gate!");
      super.openGate();
      clearTimeout(this.closedTimer);
      this.closedTimer = null;
    }
  }
  closeGate() {
    if (this.isGateOpen()) {
      console.log("Closing gate!");
      this.startClosedTimer();
      super.closeGate();
    }
  }
}
