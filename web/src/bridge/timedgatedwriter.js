
class TimedGatedWriter extends GatedWriter {
  constructor(destination, gateOpen) {
    super(destination, gateOpen);
    this.closedTimer = null;
    if (!gateOpen) {
      this.startClosedTimer();
    }
  }
  startClosedTimer() {
    this.closedTimer =
        setTimeout(
            () => console.error("Gate closed for too long!", this),
            2000);
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
