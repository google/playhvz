
class RemoteBridge {
  constructor(delegate) {
    this.database = new FirebaseDatabase(delegate);
    this.requester = new NormalRequester();
  }
  setGameId(gameId) {
    this.database.setGameId(gameId);
  }
  attemptAutoSignIn() {
    this.database.attemptAutoSignIn();
  }
  signIn() {
    this.database.signIn();
  }
}
