'use strict';

// this.__proto__ = inner; would be if we ever want to completely
// opt out of a layer for a certain function. like if we ever
// had a getAllGames method, we'd just completely opt it out of
// the securing layer.
// However, that would accidentally bring properties in, and call
// functions on the wrong scopes, so lets stick to doing it manually

// note to self, dont call superclass methods by saying
// this.__proto__.someMethod.call(this, stuff)
// because this.__proto__ is the base class of the leaf class.
// if you call it from a base class, it's still the base class of
// the leaf class.

function SecuringWrapper(inner, isLoggedIn, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      if (!isLoggedIn()) {
        throw "Not logged in! Can't call " + funcName;
      }
      return inner[funcName](...args);
    }
  }
}

function CloningWrapper(inner, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      // console.log('Calling', funcName, 'with args', ...args);
      return Utils.copyOf(inner[funcName](...args.map(Utils.copyOf)));
    }
  }
}

function DelayingWrapper(inner, funcNames) {
  for (const funcName of funcNames) {
    this[funcName] = function(...args) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const result = inner[funcName](...args);
            setTimeout(() => resolve(result));
          } catch (error) {
            console.error(error);
            setTimeout(() => reject(error));
          }
        }, 100);
      });
    };
  }
}

function makeFakePrepopulatedServerBridge() {
  var kimUserId = Utils.generateId("user");
  var evanUserId = Utils.generateId("user");
  var kimPlayerId = Utils.generateId("player");
  var evanPlayerId = Utils.generateId("player");
  var gameId = Utils.generateId("game");
  var humanChatRoom = Utils.generateId("chat");
  var zedChatRoom = Utils.generateId("chat");
  var firstMissionId = Utils.generateId("mission");
  var rewardCategoryId = Utils.generateId("rewardCategory");
  var rewardId = Utils.generateId("reward");
  var otherRewardId = Utils.generateId("reward");
  var thirdRewardId = Utils.generateId("reward");
  var fakeServer = new FakeServer();
  fakeServer.register(kimUserId, 'kimikimkim@kim.com');
  fakeServer.register(evanUserId, 'verdagon@evan.com');
  fakeServer.createGame(gameId, kimUserId);
  fakeServer.joinGame(kimUserId, gameId, kimPlayerId, 'Kim the Ultimate', {});
  fakeServer.joinGame(evanUserId, gameId, evanPlayerId, 'Evanpocalypse', {});
  fakeServer.setPlayerProfileImageUrl(kimPlayerId, 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no');
  fakeServer.setPlayerProfileImageUrl(evanPlayerId, 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no');
  fakeServer.createChatRoom(humanChatRoom, kimPlayerId);
  fakeServer.addPlayerToChatRoom(humanChatRoom, evanPlayerId);
  fakeServer.addMessageToChatRoom(humanChatRoom, kimPlayerId, 'hi');
  fakeServer.createChatRoom(zedChatRoom, evanPlayerId);
  fakeServer.addPlayerToChatRoom(zedChatRoom, kimPlayerId);
  fakeServer.addMessageToChatRoom(zedChatRoom, evanPlayerId, 'zeds rule!');
  fakeServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'hoomans drool!');
  fakeServer.addMessageToChatRoom(zedChatRoom, kimPlayerId, 'monkeys eat stool!');
  fakeServer.addMission(gameId, firstMissionId, new Date().getTime() - 1000, new Date().getTime() + 1000 * 60 * 60, "/firstgame/missions/first-mission.html");
  fakeServer.addRewardCategory(rewardCategoryId, gameId, "signed up!", 2, "derp");
  fakeServer.addReward(rewardId, rewardCategoryId, "flarklebark");
  fakeServer.addReward(otherRewardId, rewardCategoryId, "shooplewop");
  fakeServer.addReward(thirdRewardId, rewardCategoryId, "lololol");
  fakeServer.claimReward(gameId, evanPlayerId, "flarklebark");
  window.fakeServer = fakeServer;

  var loggedInUserId = null;

  const securedFakeServer =
      new SecuringWrapper(
          fakeServer,
          (() => !!loggedInUserId),
          Utils.subtract(SERVER_METHODS, "logIn", "register", "getUserById"));
  securedFakeServer.logIn = (authcode) => {
    if (authcode != 'firstuserauthcode') {
      throw "Couldnt find auth code";
    }
    var userId = kimUserId;
    // To check it exists. this.__proto__ to skip the security check
    fakeServer.getUserById(userId);
    loggedInUserId = userId;
    return userId;
  };
  securedFakeServer.register = (...args) => fakeServer.register(...args);
  securedFakeServer.getUserById = (userId) => {
    if (loggedInUserId != userId)
      throw 'Cant get other user';
    return fakeServer.getUserById(userId);
  };

  const cloningSecuredFakeServer =
      new CloningWrapper(securedFakeServer, SERVER_METHODS);

  const delayingCloningSecuredFakeServer =
      new DelayingWrapper(cloningSecuredFakeServer, SERVER_METHODS);

  return delayingCloningSecuredFakeServer;
}
