
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
          return this.requester.sendPostRequest(methodName, {}, args);
        };
      }
    }
  }

  signIn({}) {
    if (this.userId == null) {
      return new Promise((resolve, reject) => {
        firebase.auth().getRedirectResult()
            .then((result) => {
              if (result.user) {
                this.userId = "user-" + result.user.uid;
                  this.firebaseListener.listenToUser(this.userId)
                      .then((exists) => {
                        if (exists) {
                          resolve(this.userId);
                        } else {
                          this.register({userId: this.userId})
                              .then(() => {
                                this.firebaseListener.listenToUser(this.userId);
                              })
                              .catch((error) => {
                                reject(error);
                              });
                        }
                      });
                // });
              } else {
                // This sometimes happens when we redirect away. Let it go.
              }
            })
            .catch((error) => {
              reject(error.message);
            });
        firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      });
    } else {
      throwError("Impossible");
    }
  }

  attemptAutoSignIn() {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          if (this.userId == null) {
            this.userId = "user-" + firebaseUser.uid;
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
        } else {
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

  listenToDatabase({destination}) {
    this.firebaseListener.listenToDatabase(destination);
  }

  listenToGameAsAdmin(gameId) {
    this.firebaseListener.listenToGameAsAdmin(gameId);
  }

  listenToGameAsNonAdmin(gameId, playerId) {
    this.firebaseListener.listenToGameAsNonAdmin(gameId, playerId);
  }

  register(args) {
    let {userId} = args;
    return this.requester.sendPostRequest('register', {}, {
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
