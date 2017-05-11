
class RemoteBridge {
  constructor(serverUrl, firebaseConfig, writer) {

    firebase.initializeApp(firebaseConfig);
    this.firebaseListener =
        new FirebaseListener(writer, firebase.app().database().ref());

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

  signIn() {
    if (this.userId == null) {
      return new Promise((resolve, reject) => {
        firebase.auth().getRedirectResult()
            .then((result) => {
              if (result.user) {
                this.userId = "user-" + result.user.uid;
                this.register({userId: this.userId, name: 'unused'}).then(() => {
                  this.firebaseListener.listenToUser(this.userId)
                      .then(() => resolve(this.userId))
                      .catch((e) => {
                        this.register({userId: this.userId})
                            .then(() => {
                              this.firebaseListener.listenToUser(this.userId);
                            })
                            .catch((error) => {
                              reject(error);
                            });
                      });
                });
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
      console.error("Impossible");
    }
  }

  attemptAutoSignIn() {
    return new Promise((resolve, reject) => {
      firebase.auth().onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          if (this.userId == null) {
            this.userId = "user-" + firebaseUser.uid;
            this.firebaseListener.listenToUser(this.userId)
                .then(() => {
                  resolve(this.userId);
                })
                .catch((e) => {
                  this.register({userId: this.userId, name: 'unused'}).then(() => {
                    this.firebaseListener.listenToUser(this.userId);
                    resolve(this.userId);
                  });
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

  listenToGamePublic(gameId) {
    this.firebaseListener.listenToGamePublic(gameId);
  }

  listenToGamePrivate(playerId) {
    this.firebaseListener.listenToGamePrivate(playerId);
  }

  register(args) {
    let {userId} = args;
    return this.requester.sendPostRequest('register', {}, {
      userId: userId,
      name: 'unused',
    }).then(() => {
      return userId;
    });
  }

  createPlayer(args) {
    let newArgs = Utils.copyOf(args);
    delete newArgs.volunteer;
    for (let key in args.volunteer) {
      newArgs['help' + key.slice(0, 1).toUpperCase() + key.slice(1)] = args.volunteer[key];
    }
    delete newArgs.notificationSettings;
    for (let key in args.notificationSettings) {
      newArgs['notify' + key.slice(0, 1).toUpperCase() + key.slice(1)] = args.notificationSettings[key];
    }
    return this.requester.sendPostRequest('createPlayer', {}, newArgs);
  }
}
