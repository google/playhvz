
function makePlayerProperties(id, userId, gameId, name) {
  return {
    playerId: id,
    active: true,
    userId: userId,
    gameId: gameId,
    name: name,
    canInfect: false,
    needGun: false,
    profileImageUrl: "",
    startAsZombie: "yes",
    beSecretZombie: "maybe",
    volunteer: {
      advertising: false,
      logistics: false,
      communications: false,
      moderator: false,
      cleric: false,
      sorcerer: false,
      admin: false,
      photographer: false,
      chronicler: false,
      mobile: false,
      server: false,
      client: false,
    },
    notificationSettings: {
      sound: false,
      vibrate: true,
    },
    notes: '',
    gotEquipment: false,
  };
}

function populatePlayers(server, gameId, numPlayers, numStartingZombies, numDays, numShuffles) {
  let zombiesStartIndex = 0;
  let zombiesEndIndex = numStartingZombies;
  let gameStartTimestamp = new Date().getTime();
  let lifeCodeNumber = 1001;

  // For console logging only
  // let numHumans = 0;
  // let numZombies = numStartingZombies;

  // Make that many players, start that many of them as zombies, and simulate that
  // many days. In each of the days, each zombie infects a human.
  // Should end in zombiesEndIndex*(2^numDays) zombies.
  let playerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    let userId = server.idGenerator.newUserId();
    server.register({userId: userId, name: "User " + i});
    let playerId = server.idGenerator.newPlayerId();
    server.createPlayer(makePlayerProperties(playerId, userId, gameId, 'Player' + i));
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = zombiesEndIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + lifeCodeNumber++;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;
    server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[i]}, lifeCode);
    // numHumans++;
  }
  // console.log(server.time, numHumans, numZombies);
  for (let i = 0; i < numDays; i++) {
    let dayStartTimestamp = gameStartTimestamp + i * 24 * 60 * 60 * 1000; // 24 hours
    for (let j = zombiesStartIndex; j < zombiesEndIndex; j++) {
      let infectorId = playerIds[j];
      let infecteeId = playerIds[zombiesEndIndex + j];
      let infecteeLifeCode = lifeCodesByPlayerId[infecteeId];
      server.inner.setTime(dayStartTimestamp + j * 11 * 60 * 1000); // infections are spread by 11 minutes
      server.infect({infectionId: server.idGenerator.newInfectionId(), playerId: infectorId, infecteeLifeCode: infecteeLifeCode, infecteePlayerId: null});
      // console.log(server.time, --numHumans, ++numZombies);
    }
    zombiesEndIndex *= 2;

    if (i == 0) {
      // End of first day, revive the starting zombies
      server.inner.setTime(dayStartTimestamp + i * 12 * 60 * 60 * 1000); // 12 hours past day start
      for (let j = 0; j < numStartingZombies; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[j]}, lifeCode);
        // console.log(server.time, ++numHumans, --numZombies);
      }
      zombiesStartIndex = numStartingZombies;
    }
    if (i == 1) {
      server.inner.setTime(dayStartTimestamp + i * 12 * 60 * 60 * 1000); // 12 hours past day start
      // End of second day, revive a 3 random humans
      for (let j = zombiesStartIndex; j < zombiesStartIndex + 3; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[j]}, lifeCode);
        // console.log(server.time, ++numHumans, --numZombies);
      }
      zombiesStartIndex += 3;
    }
  }
}

function populatePlayersLight(server, gameId) {
  populatePlayers(server, gameId, 50, 7, 2, 3);
}

function populatePlayersHeavy(server, gameId) {
  populatePlayers(server, gameId, 300, 7, 5, 3);
}

function populateFakeServer(server, userIds) {
  let {kimUserId, reggieUserId, minnyUserId, evanUserId, moldaviUserId, zekeUserId, jackUserId} = userIds;

  server.register({userId: kimUserId, name: "Kim"});
  server.register({userId: reggieUserId, name: "Reggie"});
  server.register({userId: minnyUserId, name: "Minny"});
  server.register({userId: evanUserId, name: "Evan"});
  server.register({userId: zekeUserId, name: "Zeke"});
  server.register({userId: moldaviUserId, name: "Moldavi"});
  server.register({userId: jackUserId, name: "Jack"});

  var gameId = "game-2017m";
  server.createGame({gameId: gameId, adminUserId: kimUserId, name: "Test game", rulesHtml: "<b>Dont be a deck</b>", stunTimer: 60, active: true});

  var resistanceGroupId = server.idGenerator.newGroupId('resistance');
  server.createGroup({groupId: resistanceGroupId, name: "Resistance", gameId: gameId, ownerPlayerId: null, allegianceFilter: 'resistance', autoAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var resistanceChatRoomId = server.idGenerator.newChatRoomId();
  server.createChatRoom({chatRoomId: resistanceChatRoomId, groupId: resistanceGroupId, name: "Resistance Comms Hub", withAdmins: false});

  var hordeGroupId = server.idGenerator.newGroupId('horde');
  server.createGroup({groupId: hordeGroupId, name: "Horde", gameId: gameId, ownerPlayerId: null, allegianceFilter: 'horde', autoAdd: true, membersCanAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var zedChatRoomId = server.idGenerator.newChatRoomId();
  server.createChatRoom({chatRoomId: zedChatRoomId, groupId: hordeGroupId, name: "Horde ZedLink", withAdmins: false});

  server.addAdmin({gameId: gameId, userId: minnyUserId});

  var kimPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(kimPlayerId, kimUserId, gameId, 'Kim the Ultimate'));
  server.joinResistance({playerId: kimPlayerId}, "glarple zerp wobbledob");

  var moldaviPlayerId = server.idGenerator.newPlayerId();
  server.addAdmin({gameId: gameId, userId: moldaviUserId});
  server.createPlayer(makePlayerProperties(moldaviPlayerId, moldaviUserId, gameId, 'Moldavi the Moldavish'));
  server.setAdminContact({gameId: gameId, playerId: moldaviPlayerId});
  server.joinResistance({playerId: moldaviPlayerId}, "zooble flipwoogly");
  
  var jackPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(jackPlayerId, jackUserId, gameId, 'Jack Slayer the Bean Slasher'));
  server.joinResistance({playerId: jackPlayerId}, "grobble forgbobbly");
  
  var evanPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(evanPlayerId, evanUserId, gameId, 'Evanpocalypse'));
  server.joinHorde({playerId: evanPlayerId});

  var zekePlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(zekePlayerId, zekeUserId, gameId, 'Zeke'));
  server.joinHorde({playerId: zekePlayerId});

  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: kimPlayerId, message: 'yo dawg i hear the zeds r comin!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'man what i would do for some garlic rolls!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'https://www.youtube.com/watch?v=GrHPTWTSFgc'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  let messageId = server.idGenerator.newMessageId();
  server.sendChatMessage({messageId: messageId, chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee?'});
  server.addChatMessageRequest({requestId: server.idGenerator.newRequestId(), messageId: messageId, playerId: jackPlayerId, type: 'ack'});
  server.addChatMessageRequest({requestId: server.idGenerator.newRequestId(), messageId: messageId, playerId: kimPlayerId, type: 'ack'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  server.addChatMessageResponse({responseId: server.idGenerator.newResponseId(), playerId: jackPlayerId, messageId: messageId, text: null});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});

  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: zekePlayerId, message: 'zeds rule!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'hoomans drool!'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'monkeys eat stool!'});

  var zedSecondChatRoomGroupId = server.idGenerator.newGroupId();
  var zedSecondChatRoomId = server.idGenerator.newChatRoomId();
  server.createGroup({groupId: zedSecondChatRoomGroupId, name: "Group for " + zedSecondChatRoomId, gameId: gameId, ownerPlayerId: zekePlayerId, allegianceFilter: 'horde', autoAdd: true, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  server.createChatRoom({chatRoomId: zedSecondChatRoomId, groupId: zedSecondChatRoomGroupId, name: "Zeds Internal Secret Police", withAdmins: false});

  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, otherPlayerId: zekePlayerId});
  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, otherPlayerId: evanPlayerId});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedSecondChatRoomId, playerId: evanPlayerId, message: 'lololol we be zed police'});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedSecondChatRoomId, playerId: zekePlayerId, message: 'lololol oink oink'});

  var resistanceSecondChatRoomGroupId = server.idGenerator.newGroupId();
  var resistanceSecondChatRoomId = server.idGenerator.newChatRoomId();
  server.createGroup({groupId: resistanceSecondChatRoomGroupId, name: "Group for " + resistanceSecondChatRoomId, gameId: gameId, ownerPlayerId: kimPlayerId, allegianceFilter: 'resistance', autoAdd: false, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  server.createChatRoom({chatRoomId: resistanceSecondChatRoomId, groupId: resistanceSecondChatRoomGroupId, name: "My Chat Room!", withAdmins: false});

  server.addPlayerToGroup({groupId: resistanceSecondChatRoomGroupId, playerId: null, otherPlayerId: kimPlayerId});
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceSecondChatRoomId, playerId: kimPlayerId, message: 'lololol i have a chat room!'});

  server.updatePlayer({playerId: kimPlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'});
  server.updatePlayer({playerId: evanPlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'});
  server.updatePlayer({playerId: zekePlayerId, profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'});
  server.updatePlayer({playerId: moldaviPlayerId, profileImageUrl: 'https://katiekhau.files.wordpress.com/2012/05/scan-9.jpeg'});
  server.updatePlayer({playerId: jackPlayerId, profileImageUrl: 'https://sdl-stickershop.line.naver.jp/products/0/0/1/1009925/android/main.png'});

  var resistanceMapId = server.idGenerator.newMapId();
  server.createMap({mapId: resistanceMapId, groupId: resistanceGroupId, name: "Resistance Players"});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "First Tower", color: "FF00FF", playerId: null, mapId: resistanceMapId, latitude: 37.423734, longitude: -122.092054});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Second Tower", color: "00FFFF", playerId: null, mapId: resistanceMapId, latitude: 37.422356, longitude: -122.088078});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Third Tower", color: "FFFF00", playerId: null, mapId: resistanceMapId, latitude: 37.422757, longitude: -122.081984});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Fourth Tower", color: "FF8000", playerId: null, mapId: resistanceMapId, latitude: 37.420382, longitude: -122.083884});
  
  server.sendChatMessage({messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'hi'});

  if (Utils.getParameterByName('populate', 'light') == 'heavy') {
    populatePlayersHeavy(server, gameId);
  } else {
    populatePlayersLight(server, gameId);
  }

  var firstMissionId = server.idGenerator.newMissionId();
  server.addMission({missionId: firstMissionId, gameId: gameId, begin: new Date().getTime() - 10 * 1000, end: new Date().getTime() + 60 * 60 * 1000, name: "first mission!", detailsHtml: HUMAN_MISSION_HTML, groupId: resistanceGroupId});
  var secondMissionId = server.idGenerator.newMissionId();
  server.addMission({missionId: secondMissionId, gameId: gameId, begin: new Date().getTime() - 10 * 1000, end: new Date().getTime() + 60 * 60 * 1000, name: "second mission!", detailsHtml: ZOMBIE_MISSION_HTML, groupId: hordeGroupId});
  var rewardCategoryId = server.idGenerator.newRewardCategoryId();
  server.addRewardCategory({rewardCategoryId: rewardCategoryId, gameId: gameId, name: "signed up!", points: 2, seed: "derp", limitPerPlayer: 1});
  server.addReward({gameId: gameId, rewardId: server.idGenerator.newRewardId(), rewardCategoryId: rewardCategoryId});
  server.addReward({gameId: gameId, rewardId: server.idGenerator.newRewardId(), rewardCategoryId: rewardCategoryId});
  server.addReward({gameId: gameId, rewardId: server.idGenerator.newRewardId(), rewardCategoryId: rewardCategoryId});
  // server.claimReward(evanPlayerId, "flarklebark");
  for (let i = 0; i < 80; i++) {
    server.addGun({gunId: "gun-" + 1404 + i});
  }
  // let mission1AlertNotificationCategoryId = server.idGenerator.newNotificationCategoryId();
  // server.addNotificationCategory({notificationCategoryId: mission1AlertNotificationCategoryId, gameId: gameId, name: "mission 1 alert", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "oh god theyre everywhere run", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/missions/" + firstMissionId, icon: null});
  // server.addNotification({gameId: gameId, notificationId: server.idGenerator.newNotificationId(), playerId: kimPlayerId, notificationCategoryId: mission1AlertNotificationCategoryId, previewMessage: null, message: null, email: true, app: null, vibrate: null, sound: null, destination: null, icon: null});
  // let chatNotificationCategoryId = server.idGenerator.newNotificationCategoryId();
  // server.addNotificationCategory({notificationCategoryId: chatNotificationCategoryId, gameId: gameId, name: "chat notifications", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "blark flibby wopdoodle shorply gogglemog", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: null, icon: null});
  // server.addNotification({gameId: gameId, notificationId: server.idGenerator.newNotificationId(), playerId: kimPlayerId, notificationCategoryId: chatNotificationCategoryId, previewMessage: "Ping from Evanpocalypse!", message: "blark flibby wopdoodle shorply gogglemog", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/chat/" + resistanceChatRoomId, icon: null});

  let stunQuestionId = server.idGenerator.newQuizQuestionId();
  server.addQuizQuestion({quizQuestionId: stunQuestionId, gameId: gameId,
    text: "When you're a zombie, and a human shoots you with a nerf dart, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId,
    text: "Stand up, return to mauling humans,",
    order: 3,
    isCorrect: true,
  });

  // let infectQuestionId = server.idGenerator.newQuizQuestionId();
  // server.addQuizQuestion({quizQuestionId: infectQuestionId, gameId: gameId,
  //   text: "When you're a zombie, and you touch a human, what do you do?",
  //   type: 'order',
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
  //   text: "Crouch/sit down,",
  //   order: 0,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
  //   text: "Ask the human for their life code,",
  //   order: 1,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
  //   text: "For 50 seconds, don't move from your spot (unless safety requires it),",
  //   order: 2,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
  //   text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
  //   order: 3,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
  //   text: "Stand up, return to mauling humans,",
  //   order: 4,
  //   isCorrect: true,
  // });

  // let crossQuestionId = server.idGenerator.newQuizQuestionId();
  // server.addQuizQuestion({quizQuestionId: crossQuestionId, gameId: gameId,
  //   text: "When you want to cross the street, what do you do?",
  //   type: 'order',
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Count to 15, then take off your armband,",
  //   order: 0,
  //   isCorrect: false,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Raise your nerf gun in the air so you're visible,",
  //   order: 0,
  //   isCorrect: false,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Start walking across the street, looking both ways for cars,",
  //   order: 0,
  //   isCorrect: false,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Get within 15 feet of a crosswalk button (now you're out of play),",
  //   order: 0,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Press the crosswalk button,",
  //   order: 1,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "When the walk signal appears, walk (not run) across the crosswalk,",
  //   order: 2,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
  //   order: 0,
  //   isCorrect: false,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Wait until there are no more players in the crosswalk,",
  //   order: 3,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
  //   order: 4,
  //   isCorrect: true,
  // });
  // server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
  //   text: "When the humans go, have a zombie count \"3 zombie horde, 2 zombie horde, 1 zombie horde, go!\" and the zombies are in play,",
  //   order: 5,
  //   isCorrect: true,
  // });
}

const HUMAN_MISSION_HTML = `
<p>
<b>TL;DR: Meet at charleston park!</b>
</p>
<p>
Men and women of the Stradivarius! You all know the situation. The zeds have overrun the planet beneath us, and soon they'll overrun every planet in the sector. With the communication tower down, our loved ones back on the planets will certainly be overrun by the zeds.
</p>
<p>
We are now in geosynchronous orbit above the sector’s communication tower. The area is completely crawling with zeds. Even if ships went down there to fix the tower, the zeds who have taken over the defense systems will shoot them down once they enter the atmosphere, and there’s certainly no chance that any ship will make it back into orbit afterwards.
</p>
<p>
It's a suicide mission. But for our families, we do what we must.
</p>
<p>
Once we get down to the surface, we must meet at the below location, a place the locals once called <b>Charleston Park</b>.
<p>
<iframe style="width: 100%; height: 300px; border-width: 0;" src="https://www.google.com/maps/d/embed?mid=1_jSfVfafWm3IZ-txxSQ4rcSYrsA&ll=37.42155881938754%2C-122.08218634299163&z=17"></iframe>
`;

const ZOMBIE_MISSION_HTML = `
<p>
<b>TL;DR: Brns</b>
</p>
<p>
Barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns
</p>
<p>
 barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns barns
</p>
<p>
brans
</p>
<p>
arbs
<p>
<iframe style="width: 100%; height: 300px; border-width: 0;" src="https://www.google.com/maps/d/embed?mid=1_jSfVfafWm3IZ-txxSQ4rcSYrsA&ll=37.42155881938754%2C-122.08218634299163&z=17"></iframe>
`;