// Copyright 2017 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// TODO: High-level file comment.


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
      console.log("Since signInMethod is 'accessToken', logging out first...");
      firebase.auth().signOut();
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
                  this.register({userId: this.userId}).then(() => {
                    resolve(this.userId);
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

  listenToGame(userId, gameId, destination) {
    this.firebaseListener.listenToGame(userId, gameId, destination);
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
