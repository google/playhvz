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
  constructor(serverUrl, firebaseConfig, alertHandler, getGame) {
    this.alertHandler = alertHandler;
    this.getGame = getGame;

    firebase.initializeApp(firebaseConfig);
    this.firebaseRoot = firebase.app().database().ref();
    this.firebaseListener = new FirebaseListener(this.firebaseRoot);

    this.requester = new NormalRequester(serverUrl, alertHandler);

    this.userId = null;

    this.game = null;

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
      this.signOut();
      let email = Utils.getParameterByName('email', null);
      let password = Utils.getParameterByName('password', null);
      if (!email || !password) {
        this.alertHandler('Email and password must be set');
        return;
      }
      console.log('Signing in with email and password...');
      firebase.auth().signInWithEmailAndPassword(email, password);
    } else if (signInMethod == 'accessToken') {
      console.log("Since signInMethod is 'accessToken', logging out first...");
      this.signOut();
      let accessToken = Utils.getParameterByName('accessToken', null);
      if (!accessToken) {
        this.alertHandler('If signInMethod=accessToken, then accessToken must be set!');
        return;
      }
      console.log('Signing in with credential...');

      let provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      let credential = provider.credential(accessToken, null);
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
                    resolve({userId: this.userId, email: firebaseUser.email});
                  });
                } else {
                  // Sometimes we get spurious auth changes.
                  // As long as we stick with the same user, its fine.
                  assert("user-" + firebaseUser.uid == this.userId);
                }
              });
            } else {
              console.log('onAuthStateChanged called with a null firebaseUser.');
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
    window.localStorage.clear();
    return firebase.auth().signOut();
  }

  listenToGame(userId, gameId, destination) {
    return this.firebaseListener.listenToGame(
        userId,
        gameId,
        new ObservableWriter(
            destination,
            (operation) => {
              if (operation.type == 'set' && operation.path.length == 0) {
                // The game object has come, store it for later use
                this.game = operation.value;
              }
            }));
  }

  register(args) {
    let {userId} = args;
    return new Promise((resolve, reject) => {
      let cachedUserId = window.localStorage.getItem('userId');
      if (userId == cachedUserId) {
        setTimeout(() => resolve(cachedUserId), 0);
      } else {
        this.requester
            .sendRequest('register', {
              userId: userId,
              requestingUserId: null, // Overrides what the requester wants to do
            })
            .then(
                () => {
                  window.localStorage.setItem('userId', userId);
                  resolve(userId);
                },
                reject);
      }
    });
  }

  setPlayerId(playerId) {
    this.requester.setRequestingPlayerId(playerId);
  }

  waitUntilExists(ref) {
    return new Promise((resolve, reject) => {
      function listener() {
        ref.off('value', listener);
        resolve();
      };
      ref.on('value', listener);
    });
  }

  sendChatMessage(args) {
    let {gameId, messageId, chatRoomId, playerId, message, location, image} = args;
    assert(playerId);
    assert(messageId);
    let chatRoomRef = this.firebaseRoot.child(`/chatRooms/${chatRoomId}`);
    return this.waitUntilExists(chatRoomRef)
        .then(() => {
          let firebaseMessage = {
            playerId: playerId,
            time: firebase.database.ServerValue.TIMESTAMP,
          };
          if (message) 
            firebaseMessage.message = message;
          if (location)
            firebaseMessage.location = location;
          if (image)
            firebaseMessage.image = image;

          return chatRoomRef.child('messages').child(messageId).set(firebaseMessage);
        });
  }

  updateChatRoomMembership(args) {
    let {chatRoomId, actingPlayerId, lastHiddenTime, lastSeenTime} = args;
    let actingPrivatePlayerId = this.game.playersById[actingPlayerId].privatePlayerId;
    assert(chatRoomId, actingPlayerId);
    let membershipRef = this.firebaseRoot.child(`/privatePlayers/${actingPrivatePlayerId}/chatRoomMemberships/${chatRoomId}`);
    return this.waitUntilExists(membershipRef)
        .then(() => {
          let promises = [];
          if (lastHiddenTime !== undefined)
            promises.push(membershipRef.child('lastHiddenTime').set(lastHiddenTime));
          if (lastSeenTime !== undefined)
            promises.push(membershipRef.child('lastSeenTime').set(lastSeenTime));
          return Promise.all(promises);
        });
  }
}
