
class RemoteBridge {
  constructor(serverUrl, firebaseConfig) {
    firebase.initializeApp(firebaseConfig);
    this.firebaseListener =
        new FirebaseListener(firebase.app().database().ref());

    this.requester = new NormalRequester(serverUrl);

    this.userId = null;

    for (let methodName of Bridge.METHODS) {
      if (!this[methodName]) {
        this[methodName] = function(args) {
          return this.requester.sendRequest(methodName, args);
        };
      }
    }

    let signInMethod = Utils.getParameterByName('signInMethod', 'google');
    assert(signInMethod == 'google' || signInMethod == 'email' || signInMethod == 'accessToken', 'signInMethod must be "google" or "email" or "accessToken"!');
    if (signInMethod == 'email') {
      console.log("Since signInMethod is 'email', logging out first...");
      firebase.auth().signOut();
      let email = Utils.getParameterByName('email', null);
      let password = Utils.getParameterByName('password', null);
      if (!email || !password) {
        alert('Email and password must be set');
        return;
      }
      console.log('Signing in with email and password...');
      firebase.auth().signInWithEmailAndPassword(email, password);
    } else if (signInMethod == 'accessToken') {
      let accessToken = Utils.getParameterByName('accessToken', null);
      if (!accessToken) {
        alert('If signInMethod=accessToken, then accessToken must be set!');
        return;
      }
      console.log('Signing in with credential...');
      let provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      let credential = provider.credential(null, accessToken);
      firebase.auth().signInWithCredential(credential);
    }

    this.signedInPromise =
        new Promise((resolve, reject) => {
          firebase.auth().onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
              console.log('Sign in successful!');
              firebaseUser.getIdToken(false).then((userIdJwt) => {
                if (this.userId == null) {
                  this.userId = "user-" + firebaseUser.uid;
                  this.requester.setRequestingUserIdAndJwt(userIdJwt, this.userId);
                  this.firebaseListener.listenToUser(this.userId, false)
                      .then((exists) => {
                        if (exists) {
                          resolve(this.userId);
                        } else {
                          this.register({userId: this.userId}).then(() => {
                            this.firebaseListener.listenToUser(this.userId, true);
                            resolve(this.userId);
                          });
                        }
                      });
                } else {
                  // Sometimes we get spurious auth changes.
                  // As long as we stick with the same user, its fine.
                  assert("user-" + firebaseUser.uid == this.userId);
                }
              });
            }
          });
        });
  }

  signIn({}) {
    if (this.userId == null) {
      return new Promise((resolve, reject) => {
        console.log('Signing in with redirect...');
        let provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        firebase.auth().signInWithRedirect(provider);
      });
    } else {
      throwError("Called signIn when already signed in!");
    }
  }

  getSignedInPromise() {
    return this.signedInPromise;
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

  listenToDatabase({destination}) {
    this.firebaseListener.listenToDatabase(destination);
  }

  listenToGameAsAdmin(gameId) {
    this.firebaseListener.listenToGameAsAdmin(gameId);
  }

  listenToGameAsPlayer(gameId, playerId) {
    this.firebaseListener.listenToGameAsPlayer(gameId, playerId);
  }

  register(args) {
    let {userId} = args;
    return this.requester.sendRequest('register', {
      userId: userId,
      requestingUserId: null, // Overrides what the requester wants to do
    }).then(() => {
      return userId;
    });
  }

  setPlayerId(playerId) {
    this.requester.setRequestingPlayerId(playerId);
  }
}
