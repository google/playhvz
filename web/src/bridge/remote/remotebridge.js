
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
          this.delegate.onUserSignedIn(userId);
        },
        (error) => {
          this.delegate.onAutoSignInFailed();
        });
  }
  signIn() {
    this.database.signIn().then((userId) => {
      this.database.register(userId);
      this.delegate.onUserSignedIn(userId);
    });
  }
  signOut() {
    this.database.signOut();
  }
  createGame(gameId, adminUserId, {name, rulesUrl, stunTimer}) {
    this.requester.sendPutRequest('/games/' + gameId, {
      id: gameId,
      adminUserId: adminUserId,
      name: name,
      rulesUrl: rulesUrl,
      stunTimer: stunTimer,
    });
  }
  joinGame(playerId, userId, gameId, {name, needGun, profileImageUrl, startAsZombie, volunteer, beSecretZombie}) {
    this.database.joinGame(playerId, userId, gameId, {name, needGun, profileImageUrl, startAsZombie, volunteer, beSecretZombie});
    // this.requester.sendPutRequest('/games/' + gameId + '/players/' + playerId, {
    //   id: playerId,
    //   userId: userId,
    //   gameId: gameId,
    //   name: name,
    //   needGun: needGun,
    //   profileImageUrl: profileImageUrl,
    //   startAsZombie: startAsZombie,
    //   volunteer: volunteer,
    //   beSecretZombie: beSecretZombie,
    // });
  }
}
