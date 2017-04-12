
class RemoteBridge {
  constructor(prod, delegate) {
    this.database = new FirebaseDatabase(prod, delegate);
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
  signOut() {
    this.database.signOut();
  }
}
