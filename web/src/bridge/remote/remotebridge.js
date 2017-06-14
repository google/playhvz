
class RemoteBridge {
  constructor(serverUrl, firebaseConfig, signInMethod) {
    this.signInMethod = signInMethod;

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

    this.signedInPromise =
        new Promise((resolve, reject) => {
          firebase.auth().onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
              firebase.auth().currentUser.getToken(false).then((userToken) => {
                if (this.userId == null) {
                  this.userId = "user-" + firebaseUser.uid;
                  this.requester.setRequestingUserTokenAndId(userToken, this.userId);
                  this.firebaseListener.listenToUser(this.userId)
                      .then((exists) => {
                        if (exists) {
                          resolve(this.userId);
                        } else {
                          this.register({userId: this.userId}).then(() => {
                            this.firebaseListener.listenToUser(this.userId);
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
        let signInMethod = Utils.getParameterByName('signInMethod', 'google');
        assert(signInMethod == 'google' || signInMethod == 'email', 'signInMethod must be "google" or "email"!');
        if (signInMethod == 'email') {
          let email = Utils.getParameterByName('email', null);
          let password = Utils.getParameterByName('password', null);
          if (!email || !password) {
            alert('Email and password must be set');
            return;
          }

          firebase.auth().signInWithEmailAndPassword(email, password);
        } else {
          firebase.auth().getRedirectResult();
          firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
        }
      });
    } else {
      throwError("Impossible");
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
