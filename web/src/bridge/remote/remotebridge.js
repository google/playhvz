
class RemoteBridge {
  constructor(serverUrl, firebaseConfig, delegate) {
    this.delegate = delegate;
    this.localDb = new LocalDatabase({
      set: (...args) => this.delegate.set(...args),
      insert: (...args) => this.delegate.insert(...args),
      remove: (...args) => this.delegate.remove(...args),
      get: (...args) => this.delegate.get(...args),
    });

    firebase.initializeApp(firebaseConfig);
    this.firebaseListener =
        new FirebaseListener(
            this.localDb,
            firebase.app().database().ref());

    this.requester = new NormalRequester(serverUrl);

    this.userId = null;
  }

  signIn() {
    if (this.userId == null) {
      return new Promise((resolve, reject) => {
        firebase.auth().getRedirectResult()
            .then((result) => {
              this.userId = result.user.uid;
              this.register(userId);
              resolve(result.user.uid);
            }).catch((error) => {
              reject(error.message);
            });
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/plus.login');
        firebase.auth().signInWithRedirect(provider);
      });
    } else {
      this.register(this.userId);
    }
  }

  attemptAutoSignIn() {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          this.userId = firebaseUser.uid;
          this.delegate.onUserSignedIn(firebaseUser.uid);
          resolve(firebaseUser.uid);
        } else {
          this.delegate.onAutoSignInFailed();
          reject();
        }
      });
    });
  }

  signOut() {
    firebase.auth().signOut()
        .then((result) => {
          alert("Signed out!");
          window.location.reload();
        }).catch((error) => {
          console.error(error);
        });
  }

  listenToGame(gameId) {
    this.firebaseListener.listenToGame(gameId);
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
