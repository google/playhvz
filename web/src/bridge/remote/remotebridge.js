
class RemoteBridge {
  constructor(serverUrl, firebaseConfig, writer) {

    firebase.initializeApp(firebaseConfig);
    this.firebaseListener =
        new FirebaseListener(writer, firebase.app().database().ref());

    this.requester = new NormalRequester(serverUrl);

    this.userId = null;
  }

  signIn() {
    if (this.userId == null) {
      return new Promise((resolve, reject) => {
        firebase.auth().getRedirectResult()
            .then((result) => {
              if (result.user) {
                this.userId = "user-" + result.user.uid;
                this.register({
                  userId: this.userId,
                  name: firebaseUser.displayName,
                })
                    .then(() => {
                      this.firebaseListener.listenToUser(this.userId)
                          .then(() => resolve(this.userId))
                          .catch((e) => {
                            console.error(e);
                            this.register({userId: this.userId})
                                .then(() => {
                                  this.firebaseListener.listenToUser(this.userId);
                                });
                          });
                    });
              } else {
                // This sometimes happens when we redirect away. Let it go.
              }
            }).catch((error) => {
              reject(error.message);
            });
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/plus.login');
        firebase.auth().signInWithRedirect(provider);
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
                .then(() => resolve(firebaseUser.uid))
                .catch((e) => {
                  console.error(e);
                  this.register({
                    userId: this.userId,
                    name: firebaseUser.displayName,
                  })
                      .then(() => {
                        this.firebaseListener.listenToUser(this.userId);
                      });
                });
            resolve(this.userId);
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

  listenToGame(gameId) {
    this.firebaseListener.listenToGame(gameId);
  }

  register(args) {
    let {userId} = args;
    return this.requester.sendPostRequest('register', {}, {
      userId: userId,
    }).then(() => {
      return userId;
    });
  }

  createGame(args) {
    this.requester.sendPostRequest('createGame', {}, args);
  }

  joinGame(playerId, userId, gameId, {name, needGun, profileImageUrl, startAsZombie, volunteer}) {
    this.requester.sendPostRequest(
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

  addGun({id}) {
    this.requester.sendPostRequest('addGun', {}, {gunId: id});
  }

  assignGun({gunId, playerId}) {
    this.requester.sendPostRequest('assignGun', {}, {gunId: gunId, playerId: playerId});
  }

  addPlayerToChatRoom({chatRoomId, playerId}) {
    this.requester.sendPostRequest('addPlayerToChatRoom', {}, {chatRoomId: chatRoomId, playerId: playerId});
  }
}
