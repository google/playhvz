
function populateFakeServer(server, isRegistered, isAdmin, isJoined) {
  // registered, admin, and joined
  var kimUserId = Bridge.generateUserId();
  server.register(kimUserId, {});
  // registered, thats it
  let reggieUserId = Bridge.generateUserId();
  server.register(reggieUserId, {});
  // registered and is admin, not joined
  let minnyUserId = Bridge.generateUserId();
  server.register(minnyUserId, {});
  // registered and joined
  var evanUserId = Bridge.generateUserId();
  server.register(evanUserId, {});
  // just some other dude in a chat room...
  var zekeUserId = Bridge.generateUserId();
  server.register(zekeUserId, {});

  var gameId = "game-2017m";
  server.createGame(gameId, kimUserId, {name: "Test game", rulesUrl: "/firstgame/rules.html", stunTimer: 60});
  server.addAdmin(Bridge.generateAdminId(), gameId, minnyUserId);
  var kimPlayerId = Bridge.generatePlayerId();
  server.joinGame(kimPlayerId, kimUserId, gameId, {name: 'Kim the Ultimate', needGun: false, profileImageUrl: "", startAsZombie: false, volunteer: false, beSecretZombie: true,});
  var evanPlayerId = Bridge.generatePlayerId();
  server.joinGame(evanPlayerId, evanUserId, gameId, {name: 'Evanpocalypse', needGun: true, profileImageUrl: "", startAsZombie: false, volunteer: false, beSecretZombie: true,});
  var zekePlayerId = Bridge.generatePlayerId();
  server.joinGame(zekePlayerId, zekeUserId, gameId, {name: 'Zeke', needGun: false, profileImageUrl: "", startAsZombie: true, volunteer: true, beSecretZombie: true,});
  
  let numPlayers = 100;
  let humansStartIndex = 7;
  let numBattles = 2;
  let numShuffles = 3;
  // Make that many players, start that many of them as zombies, and have that
  // many battles. In each of the battles, each zombie infects a human.
  // Should end in humansStartIndex*(2^numBattles) zombies.
  let playerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    let userId = Bridge.generateUserId();
    server.register(userId, {});
    let playerId = Bridge.generatePlayerId();
    server.joinGame(playerId, userId, gameId, {name: 'Player' + i, needGun: false, profileImageUrl: "", startAsZombie: false, volunteer: false, beSecretZombie: false,});
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = humansStartIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + i;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;
    server.addLife(Bridge.generateLifeId(), playerIds[i], lifeCode);
  }
  for (let i = 0; i < numBattles; i++) {
    for (let j = 0; j < humansStartIndex; j++) {
      let infectorId = playerIds[j];
      let infecteeId = playerIds[humansStartIndex + j];
      let infecteeLifeCode = lifeCodesByPlayerId[infecteeId];
      server.infect(Bridge.generateInfectionId(), infectorId, infecteeLifeCode);
    }
    humansStartIndex *= 2;
  }

  server.updatePlayer(kimPlayerId, {profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'});
  server.updatePlayer(evanPlayerId, {profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'});
  server.updatePlayer(zekePlayerId, {profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'});
  var humanChatRoomId = Bridge.generateChatRoomId();
  server.createChatRoom(humanChatRoomId, kimPlayerId, {name: "Resistance Comms Hub", allegianceFilter: 'resistance'});
  server.addPlayerToChatRoom(humanChatRoomId, evanPlayerId);
  server.addPlayerToChatRoom(humanChatRoomId, kimPlayerId);
  server.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'hi'});
  var zedChatRoomId = Bridge.generateChatRoomId();
  server.createChatRoom(zedChatRoomId, evanPlayerId, {name: "Horde ZedLink", allegianceFilter: 'horde'});
  server.addPlayerToChatRoom(zedChatRoomId, zekePlayerId);
  server.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, evanPlayerId, {message: 'zeds rule!'});
  server.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'hoomans drool!'});
  server.addMessageToChatRoom(Bridge.generateMessageId(), humanChatRoomId, kimPlayerId, {message: 'monkeys eat stool!'});
  var firstMissionId = Bridge.generateMissionId();
  server.addMission(firstMissionId, gameId, {beginTime: new Date().getTime() / 1000 - 10, endTime: new Date().getTime() / 1000 + 60 * 60, name: "first mission!", url: "/firstgame/missions/first-mission.html", allegianceFilter: 'resistance'});
  var rewardCategoryId = Bridge.generateRewardCategoryId();
  server.addRewardCategory(rewardCategoryId, gameId, {name: "signed up!", points: 2, seed: "derp"});
  server.addReward(Bridge.generateRewardId(), rewardCategoryId, {});
  server.addReward(Bridge.generateRewardId(), rewardCategoryId, {});
  server.addReward(Bridge.generateRewardId(), rewardCategoryId, {});
  // server.claimReward(evanPlayerId, "flarklebark");
  for (let i = 0; i < 80; i++) {
    server.addGun("gun-" + 1404 + i, {});
  }
  let mission1AlertNotificationCategoryId = Bridge.generateNotificationCategoryId();
  server.addNotificationCategory(mission1AlertNotificationCategoryId, gameId, {name: "mission 1 alert", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "oh god theyre everywhere run", sendTime: new Date() / 1000 + 3600, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/missions/" + firstMissionId, icon: null});
  server.addNotification(Bridge.generateNotificationId(), kimPlayerId, mission1AlertNotificationCategoryId, {previewMessage: null, message: null, email: true, app: null, vibrate: null, sound: null, destination: null});
  let chatNotificationCategoryId = Bridge.generateNotificationCategoryId();
  server.addNotificationCategory(chatNotificationCategoryId, gameId, {name: "chat notifications", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "blark flibby wopdoodle shorply gogglemog", sendTime: new Date() / 1000 + 3600, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: null, icon: null});
  server.addNotification(Bridge.generateNotificationId(), kimPlayerId, chatNotificationCategoryId, {previewMessage: "Ping from Evanpocalypse!", message: "blark flibby wopdoodle shorply gogglemog", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/chat/" + humanChatRoomId});

  let stunQuestionId = Bridge.generateQuizQuestionId();
  server.addQuizQuestion(stunQuestionId, gameId, {
    text: "When you're a zombie, and a human shoots you with a nerf dart, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), stunQuestionId, {
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), stunQuestionId, {
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), stunQuestionId, {
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), stunQuestionId, {
    text: "Stand up, return to mauling humans,",
    order: 3,
    isCorrect: true,
  });

  let infectQuestionId = Bridge.generateQuizQuestionId();
  server.addQuizQuestion(infectQuestionId, gameId, {
    text: "When you're a zombie, and you touch a human, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), infectQuestionId, {
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), infectQuestionId, {
    text: "Ask the human for their life code,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), infectQuestionId, {
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), infectQuestionId, {
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), infectQuestionId, {
    text: "Stand up, return to mauling humans,",
    order: 4,
    isCorrect: true,
  });

  let crossQuestionId = Bridge.generateQuizQuestionId();
  server.addQuizQuestion(crossQuestionId, gameId, {
    text: "When you want to cross the street, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Count to 15, then take off your armband,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Raise your nerf gun in the air so you're visible,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Start walking across the street, looking both ways for cars,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Get within 15 feet of a crosswalk button (now you're out of play),",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Press the crosswalk button,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "When the walk signal appears, walk (not run) across the crosswalk,",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Wait until there are no more players in the crosswalk,",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
    order: 4,
    isCorrect: true,
  });
  server.addQuizAnswer(Bridge.generateQuizAnswerId(), crossQuestionId, {
    text: "When the humans go, have a zombie count \"3 zombie horde, 2 zombie horde, 1 zombie horde, go!\" and the zombies are in play,",
    order: 5,
    isCorrect: true,
  });

  if (isRegistered) {
    if (isAdmin) {
      if (isJoined) {
        return kimUserId;
      } else {
        return minnyUserId;
      }
    } else {
      if (isJoined) {
        return evanUserId;
      } else {
        return reggieUserId;
      }
    }
  } else {
    return null;
  }
}
