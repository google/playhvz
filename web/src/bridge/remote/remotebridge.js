
class RemoteBridge {
  constructor(serverUrl, firebaseConfig, delegate) {
    this.delegate = delegate;
    this.database = new FirebaseDatabase(firebaseConfig, {
      set: delegate.set,
      push: delegate.push,
      splice: delegate.splice,
      get: delegate.get,
    });
    this.requester = new NormalRequester(serverUrl);
  }
  
  setGameId(gameId) {
    this.database.setGameId(gameId);
  }

  attemptAutoSignIn() {
    this.database.attemptAutoSignIn().then(
        (userId) => {
          this.userId = userId;
          this.delegate.onUserSignedIn(userId);
        },
        (error) => {
          this.delegate.onAutoSignInFailed();
        });
  }

  signIn() {
    if (this.userId == null) {
      this.database.signIn().then((userId) => {
        this.register(userId);
        this.delegate.onUserSignedIn(userId);
      });
    } else {
      this.register(this.userId);
    }
  }

  signOut() {
    this.database.signOut();
  }

  register(userId) {
    this.requester.sendPostRequest('register', {id: userId}, {});
  }

  createGame(gameId, adminUserId, {name, rulesUrl, stunTimer}) {
    this.requester.sendPutRequest(
        'createGame',
        {id: gameId, adminUserId: adminUserId},
        {
          name: name,
          rulesUrl: rulesUrl,
          stunTimer: stunTimer,
        });
  }

  joinGame(playerId, userId, gameId, {name, needGun, profileImageUrl, startAsZombie, volunteer}) {
    this.requester.sendPutRequest(
        'joinGame',
        {id: playerId, userId: userId, gameId: gameId},
        {
          name: name,
          needGun: needGun,
          profileImageUrl: profileImageUrl,
          startAsZombie: startAsZombie,
          volunteer: volunteer,
        });
  }
}
