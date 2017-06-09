let FAKE_USER_IDS = {
  zellaUserId: 'user-vITrvbEGVvh9A4WLXxWFYMbzQP02', // hvzzella@gmail.com
  reggieUserId: 'user-reggie',
  minnyUserId: 'user-minny',
  drakeUserId: 'user-NeNOfho4yeMZncSmX9OZ3xfBQx72', // hvzdrake@gmail.com
  zekeUserId: 'user-qcLGfbZMLiaUZ8so1qfxT1LLuuF3', // verdagon9@gmail.com
  moldaviUserId: 'user-zeke',
  jackUserId: 'user-jack',
  deckerdUserId: 'user-deckerd',
};

function populateUsers(server, userIds) {
  let {zellaUserId, reggieUserId, minnyUserId, deckerdUserId, drakeUserId, moldaviUserId, zekeUserId, jackUserId} = userIds;

  server.register({userId: zellaUserId});
  server.register({userId: reggieUserId});
  server.register({userId: minnyUserId});
  server.register({userId: drakeUserId});
  server.register({userId: zekeUserId});
  server.register({userId: moldaviUserId});
  server.register({userId: jackUserId});
  server.register({userId: deckerdUserId});
}

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
    wantToBeSecretZombie: true,
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
      android: false,
      ios: false,
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
  let gameStartOffset = 0;
  let lifeCodeNumber = 1001;

  // For console logging only
  let numHumans = 0;
  let numZombies = numStartingZombies;

  // Make that many players, start that many of them as zombies, and simulate that
  // many days. In each of the days, each zombie infects a human.
  // Should end in zombiesEndIndex*(2^numDays) zombies.
  let playerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    let userId = server.idGenerator.newUserId();
    server.register({userId: userId});
    let playerId = server.idGenerator.newPlayerId();
    server.createPlayer(makePlayerProperties(playerId, userId, gameId, 'Player' + i));
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = zombiesEndIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + lifeCodeNumber++;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;
    server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[i], lifeCode: lifeCode});
    // console.log("Adding first life to player", playerIds[i]);
    numHumans++;
  }
  // console.log(server.inner.time, numHumans, numZombies);
  for (let i = 0; i < numDays; i++) {
    let dayStartOffset = gameStartOffset + i * 24 * 60 * 60 * 1000; // 24 hours
    for (let j = zombiesStartIndex; j < zombiesEndIndex; j++) {
      let infectorId = playerIds[j];
      let victimId = playerIds[zombiesEndIndex + j];
      let victimLifeCode = lifeCodesByPlayerId[victimId];
      server.setTimeOffset({offsetMs: dayStartOffset + j * 11 * 60 * 1000}); // infections are spread by 11 minutes
      server.infect({
        gameId: gameId,
        infectionId: server.idGenerator.newInfectionId(),
        infectorPlayerId: infectorId,
        victimLifeCode: victimLifeCode,
        victimPlayerId: null
      });
      // console.log("At", server.inner.time, "humans:", --numHumans, "zombies:", ++numZombies);
    }
    zombiesEndIndex *= 2;

    if (i == 0) {
      // End of first day, revive the starting zombies
      server.setTimeOffset({offsetMs: dayStartOffset + i * 12 * 60 * 60 * 1000}); // 12 hours past day start
      for (let j = 0; j < numStartingZombies; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[j], lifeCode: lifeCode});
        // console.log("At", server.inner.time, "humans:", ++numHumans, "zombies:", --numZombies);
      }
      zombiesStartIndex = numStartingZombies;
    }
    if (i == 1) {
      server.setTimeOffset({offsetMs: dayStartOffset + i * 12 * 60 * 60 * 1000}); // 12 hours past day start
      // End of second day, revive a 3 random humans
      for (let j = zombiesStartIndex; j < zombiesStartIndex + 3; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        server.addLife({lifeId: server.idGenerator.newLifeId(), playerId: playerIds[j], lifeCode: lifeCode});
        // console.log("At", server.inner.time, "humans:", ++numHumans, "zombies:", --numZombies);
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

function populateGame(server, userIds, populateLotsOfPlayers) {
  let {zellaUserId, reggieUserId, minnyUserId, deckerdUserId, drakeUserId, moldaviUserId, zekeUserId, jackUserId} = userIds;

  var gameId = server.idGenerator.newGameId("poptest");
  server.createGame({
    gameId: gameId,
    adminUserId: zellaUserId,
    name: "Test game",
    rulesHtml: RULES_HTML,
    faqHtml: FAQ_HTML,
    stunTimer: 60,
    active: true,
    started: true,
  });

  let everyoneGroupId = server.idGenerator.newGroupId('everyone');
  let everyoneChatRoomId = server.idGenerator.newChatRoomId('everyone');
  server.createGroup({
    gameId: gameId,
    groupId: everyoneGroupId,
    name: "Everyone",
    ownerPlayerId: null,
    allegianceFilter: 'none',
    autoAdd: true,
    autoRemove: false,
    membersCanAdd: false,
    membersCanRemove: false,
  });
  server.createChatRoom({
    gameId: gameId,
    chatRoomId: everyoneChatRoomId,
    groupId: everyoneGroupId,
    name: "Global Chat",
    withAdmins: false
  });

  var resistanceGroupId = server.idGenerator.newGroupId('resistance');
  server.createGroup({groupId: resistanceGroupId, name: "Resistance", gameId: gameId, ownerPlayerId: null, allegianceFilter: 'resistance', autoAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var resistanceChatRoomId = server.idGenerator.newChatRoomId('resistance');
  server.createChatRoom({gameId: gameId, chatRoomId: resistanceChatRoomId, groupId: resistanceGroupId, name: "Resistance Comms Hub", withAdmins: false});

  server.addAdmin({gameId: gameId, userId: minnyUserId});

  var zellaPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(zellaPlayerId, zellaUserId, gameId, 'Zella the Ultimate'));
  server.joinResistance({
    gameId: gameId,
    playerId: zellaPlayerId,
    lifeCode: "glarple zerp wobbledob",
    lifeId: server.idGenerator.newLifeId()
  });

  var deckerdPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(deckerdPlayerId, deckerdUserId, gameId, 'Deckerd the Hesitant'));

  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: zellaPlayerId, message: 'yo dawg i hear the zeds r comin!'});

  var hordeGroupId = server.idGenerator.newGroupId('horde');
  server.createGroup({groupId: hordeGroupId, name: "Horde", gameId: gameId, ownerPlayerId: null, allegianceFilter: 'horde', autoAdd: true, membersCanAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var zedChatRoomId = server.idGenerator.newChatRoomId('horde');
  server.createChatRoom({gameId: gameId, chatRoomId: zedChatRoomId, groupId: hordeGroupId, name: "Horde ZedLink", withAdmins: false});

  var moldaviPlayerId = server.idGenerator.newPlayerId();
  server.addAdmin({gameId: gameId, userId: moldaviUserId});
  server.createPlayer(makePlayerProperties(moldaviPlayerId, moldaviUserId, gameId, 'Moldavi the Moldavish'));
  server.setAdminContact({gameId: gameId, playerId: moldaviPlayerId});
  server.joinResistance({
    gameId: gameId,
    playerId: moldaviPlayerId,
    lifeCode: "zooble flipwoogly",
    lifeId: null
  });
  
  var jackPlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(jackPlayerId, jackUserId, gameId, 'Jack Slayer the Bean Slasher'));
  server.joinResistance({
    gameId: gameId,
    playerId: jackPlayerId, lifeCode: "grobble forgbobbly", lifeId: null});
  
  var drakePlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(drakePlayerId, drakeUserId, gameId, 'Drackan'));
  server.joinHorde({
    gameId: gameId,
    playerId: drakePlayerId
  });

  var zekePlayerId = server.idGenerator.newPlayerId();
  server.createPlayer(makePlayerProperties(zekePlayerId, zekeUserId, gameId, 'Zeke'));
  server.joinResistance({
    gameId: gameId,
    playerId: zekePlayerId, lifeCode: "bobblewob dobblewob", lifeId: null});

  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'man what i would do for some garlic rolls!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'https://www.youtube.com/watch?v=GrHPTWTSFgc'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});

  server.infect({
    infectionId: server.idGenerator.newInfectionId(),
    infectorPlayerId: drakePlayerId,
    victimLifeCode: "bobblewob dobblewob",
    victimPlayerId: null,
    gameId: gameId,
  });
  
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: zekePlayerId, message: 'zeds rule!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hoomans drool!'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'monkeys eat stool!'});

  var zedSecondChatRoomGroupId = server.idGenerator.newGroupId();
  var zedSecondChatRoomId = server.idGenerator.newChatRoomId();
  server.createGroup({groupId: zedSecondChatRoomGroupId, name: "Group for " + zedSecondChatRoomId, gameId: gameId, ownerPlayerId: zekePlayerId, allegianceFilter: 'horde', autoAdd: true, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  server.createChatRoom({gameId: gameId, chatRoomId: zedSecondChatRoomId, groupId: zedSecondChatRoomGroupId, name: "Zeds Internal Secret Police", withAdmins: false});

  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, otherPlayerId: zekePlayerId});
  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, otherPlayerId: drakePlayerId});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedSecondChatRoomId, playerId: drakePlayerId, message: 'lololol we be zed police'});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedSecondChatRoomId, playerId: zekePlayerId, message: 'lololol oink oink'});

  var resistanceSecondChatRoomGroupId = server.idGenerator.newGroupId();
  var resistanceSecondChatRoomId = server.idGenerator.newChatRoomId();
  server.createGroup({groupId: resistanceSecondChatRoomGroupId, name: "Group for " + resistanceSecondChatRoomId, gameId: gameId, ownerPlayerId: zellaPlayerId, allegianceFilter: 'resistance', autoAdd: false, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  server.createChatRoom({gameId: gameId, chatRoomId: resistanceSecondChatRoomId, groupId: resistanceSecondChatRoomGroupId, name: "My Chat Room!", withAdmins: false});

  server.addPlayerToGroup({groupId: resistanceSecondChatRoomGroupId, playerId: null, otherPlayerId: zellaPlayerId});
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: resistanceSecondChatRoomId, playerId: zellaPlayerId, message: 'lololol i have a chat room!'});

  server.updatePlayer({gameId: gameId, playerId: zellaPlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'});
  server.updatePlayer({gameId: gameId, playerId: drakePlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'});
  server.updatePlayer({gameId: gameId, playerId: zekePlayerId, profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'});
  server.updatePlayer({gameId: gameId, playerId: moldaviPlayerId, profileImageUrl: 'https://katiekhau.files.wordpress.com/2012/05/scan-9.jpeg'});
  server.updatePlayer({gameId: gameId, playerId: jackPlayerId, profileImageUrl: 'https://sdl-stickershop.line.naver.jp/products/0/0/1/1009925/android/main.png'});

  var resistanceMapId = server.idGenerator.newMapId();
  server.createMap({mapId: resistanceMapId, groupId: resistanceGroupId, name: "Resistance Players"});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "First Tower", color: "FF00FF", playerId: null, mapId: resistanceMapId, latitude: 37.423734, longitude: -122.092054});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Second Tower", color: "00FFFF", playerId: null, mapId: resistanceMapId, latitude: 37.422356, longitude: -122.088078});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Third Tower", color: "FFFF00", playerId: null, mapId: resistanceMapId, latitude: 37.422757, longitude: -122.081984});
  server.addPoint({pointId: server.idGenerator.newPointId(), name: "Fourth Tower", color: "FF8000", playerId: null, mapId: resistanceMapId, latitude: 37.420382, longitude: -122.083884});
  
  server.sendChatMessage({gameId: gameId, messageId: server.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hi'});

  if (populateLotsOfPlayers) {
    populatePlayersHeavy(server, gameId);
  } else {
    populatePlayersLight(server, gameId);
  }

  var firstMissionId = server.idGenerator.newMissionId();
  server.addMission({
    missionId: firstMissionId,
    gameId: gameId,
    beginTime: new Date().getTime() - 10 * 1000,
    endTime: new Date().getTime() + 60 * 60 * 1000,
    name: "first human mission!",
    detailsHtml: HUMAN_MISSION_HTML,
    groupId: resistanceGroupId
  });
  var secondMissionId = server.idGenerator.newMissionId();
  server.addMission({
    missionId: secondMissionId,
    gameId: gameId,
    beginTime: new Date().getTime() - 10 * 1000,
    endTime: new Date().getTime() + 60 * 60 * 1000,
    name: "first zed mission!",
    detailsHtml: ZOMBIE_MISSION_HTML,
    groupId: hordeGroupId
  });

  var rewardCategoryId = server.idGenerator.newRewardCategoryId();
  server.addRewardCategory({
    rewardCategoryId: rewardCategoryId,
    gameId: gameId,
    name: "signed up!",
    points: 2,
    shortName: "signed",
    limitPerPlayer: 1
  });
  server.addReward({
    gameId: gameId,
    rewardId: server.idGenerator.newRewardId(),
    rewardCategoryId: rewardCategoryId,
    code: "flarklebark",
  });
  server.addReward({gameId: gameId, rewardId: server.idGenerator.newRewardId(), rewardCategoryId: rewardCategoryId, code: null});
  server.addReward({gameId: gameId, rewardId: server.idGenerator.newRewardId(), rewardCategoryId: rewardCategoryId, code: null});
  server.claimReward({
    gameId: gameId,
    playerId: drakePlayerId,
    rewardCode: "flarklebark",
  });
  for (let i = 0; i < 80; i++) {
    server.addGun({gameId: gameId, gunId: server.idGenerator.newGunId(), label: "" + (1404 + i)});
  }
  // let mission1AlertNotificationCategoryId = server.idGenerator.newNotificationCategoryId();
  // server.addNotificationCategory({notificationCategoryId: mission1AlertNotificationCategoryId, gameId: gameId, name: "mission 1 alert", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "oh god theyre everywhere run", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/missions/" + firstMissionId, icon: null});
  // server.addNotification({gameId: gameId, notificationId: server.idGenerator.newNotificationId(), playerId: zellaPlayerId, notificationCategoryId: mission1AlertNotificationCategoryId, previewMessage: null, message: null, email: true, app: null, vibrate: null, sound: null, destination: null, icon: null});
  // let chatNotificationCategoryId = server.idGenerator.newNotificationCategoryId();
  // server.addNotificationCategory({notificationCategoryId: chatNotificationCategoryId, gameId: gameId, name: "chat notifications", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "blark flibby wopdoodle shorply gogglemog", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: null, icon: null});
  // server.addNotification({gameId: gameId, notificationId: server.idGenerator.newNotificationId(), playerId: zellaPlayerId, notificationCategoryId: chatNotificationCategoryId, previewMessage: "Ping from Drackan!", message: "blark flibby wopdoodle shorply gogglemog", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/chat/" + resistanceChatRoomId, icon: null});

  let requestCategoryId = server.idGenerator.newRequestCategoryId();
  let requestId = server.idGenerator.newRequestId();
  server.addRequestCategory({requestCategoryId: requestCategoryId, chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, text: 'yee?', type: 'ack'});
  server.addRequest({requestId: requestId, requestCategoryId: requestCategoryId, playerId: jackPlayerId});
  server.addRequest({requestId: server.idGenerator.newRequestId(), requestCategoryId: requestCategoryId, playerId: zellaPlayerId});
  server.addResponse({requestId: requestId, text: null});
  
  populateQuiz(server, gameId);
}

function populateQuiz(server, gameId) {
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

  let infectQuestionId = server.idGenerator.newQuizQuestionId();
  server.addQuizQuestion({quizQuestionId: infectQuestionId, gameId: gameId,
    text: "When you're a zombie, and you touch a human, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
    text: "Ask the human for their life code,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId,
    text: "Stand up, return to mauling humans,",
    order: 4,
    isCorrect: true,
  });

  let crossQuestionId = server.idGenerator.newQuizQuestionId();
  server.addQuizQuestion({quizQuestionId: crossQuestionId, gameId: gameId,
    text: "When you want to cross the street, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Get within 15 feet of a crosswalk button (now you're out of play),",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Press the crosswalk button,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "When the walk signal appears, walk (not run) across the crosswalk,",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Wait until there are no more players in the crosswalk,",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
    order: 4,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "When the humans go, have a zombie count \"3 zombie horde, 2 zombie horde, 1 zombie horde, go!\" and the zombies are in play,",
    order: 5,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Count to 15, then take off your armband,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Raise your nerf gun in the air so you're visible,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: server.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId,
    text: "Start walking across the street, looking both ways for cars,",
    order: 0,
    isCorrect: false,
  });
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

const RULES_HTML = `
Admins may change rules as the game goes on. Keep an eye on notifications for updates!
 
<ghvz-rules-section title="Game Identification, Life Code">
<ul>
<li>Each player will be given a strip of cloth to identify them as a player, and each human will be given a life code.</li>
<li>Humans wear their band visibly on their arm, zombies wear them visibly around their head.</li>
<li>Upon being infected by a zombie, the human gives the zombie their life code.</li>
</ul>
</ghvz-rules-section>
 
<ghvz-rules-section title="Infecting">
<div>A Zombie can turn humans to zombies with a firm touch to any part of a Human including anything they are wearing and anything they are holding (unless it is an admin given shield or pool noodle). Please don't tackle!</div>
<div>When infected:</div>
<ul>
<li>Both players are now zombies, and are stunned for 1 minute.</li>
<li>The zombie must collect the victim's life code, and report the infection on go/hvz as soon as they can.</li>
<li>The zombies must count the last 10 seconds aloud.</li>
<li>After the minute is up, both players return to the game as zombies.</li>
</ul>
<ghvz-rules-collapsible title="Details">
<ul>
<li>Zombies may be given pool noodles that act as an extension of their arm, at the discretion of moderators only.</li>
<li>If there is any confusion or dispute, contact the moderator.</li>
</ul>
</ghvz-rules-collapsible>
</ghvz-rules-section>
 
<ghvz-rules-section title="Stunning">
<div>Humans can stun ANY player (humans or zombie) for 1 minute by shooting them with a nerf dart, throwing a sock at them, or hitting them with an admin given pool noodle.</div>
<div>When stunned:</div>
<ul>
<li>Crouch/sit down, and not move from their spot for 1 minute.</li>
<li>The zombie must count the last 10 seconds aloud.</li>
<li>When the minute is up, the zombie can stand up and return to mauling humans.</li>
</ul>
<ghvz-rules-collapsible title="Details">
<ul>
<li>Humans that were stunned by other humans are vulnerable to zombies while waiting to become unstunned.</li>
<li>Don’t stuff things in the socks, just roll them up.</li>
<li>Modded guns are fine, as long as they aren't too powerful: when shot horizontally from 5 feet above the ground, the dart shouldn't go further than 45 feet. Let a moderator know if someone’s gun is painful.</li>
<li>Admins may add more methods of stunning as the game goes on.</li>
<li>Zombies cannot sit down near a human unless the zombie is stunned.</li>
<li>If a stunned player is in an unsafe situation or is inconveniencing non-players, they may walk to the nearest safe location, then sit down and begin their counter from the start.</li>
<li>A stunned player may not be stunned again to restart their timer.</li>
<li>Zombies can block a stun with an admin-given shield.</li>
<li>Admins might change the stun timer during the game.</li>
<li>Once a dart leaves the gun, any player can pick it up and use it.</li>
<li>Players are encouraged to pick up darts when they can so we don’t leave a mess on campus, and players who turn in darts to the moderators will be rewarded. Please pick up your darts if possible.</li>
<li>No player may take another player’s nerf gun without permission from the owner. Any humans borrowing a gun can only give it to a moderator, NOT another player to return for them.</li>
</ul>
</ghvz-rules-collapsible>
</ghvz-rules-section>
 
<ghvz-rules-section title="Unstunning">
Any human can “unstun” any stunned human by touching them.
</ghvz-rules-section>
 
<ghvz-rules-section title="Secret Zombie">
Secret zombies are human in every way, except when a secret zombie touches a human:
<ul>
<li>Both players crouch/sit down are stunned for 1 minute.</li>
<li>The secret zombie gets the victim's life code, and report the infection on the site as soon as they can.</li>
<li>The secret zombie becomes a regular zombie and so must move the bandanna to their head.</li>
<li>The victim becomes the new secret zombie and so keeps the bandanna on their arm.</li>
<li>They must count the last 10 seconds of their stun aloud.</li>
<li>When the minute is up, they both stand up and resume playing.</li>
</ul>
</ghvz-rules-section>
 
<ghvz-rules-section title="Crossing streets">
There are many streets in the playable area for the game so please play away from traffic and use this protocol when using crosswalks:
<ul>
<li>Once you get within 15 feet of the crosswalk button, you’re out of play (can’t be infected/stunned, can’t infect/stun).</li>
<li>Press the button.</li>
<li>Once the walk sign appears, <b>everyone</b> (humans and zombies) must <b>walk</b> (not run) across the crosswalk.</li>
<li>Once there are no players still in the crosswalk, the humans say “3 resistance, 2 resistance, 1 resistance, go!” then they are in play and can run.</li>
<li>Once the humans say “go!”, the zombies, still out of play, will say “3 zombie horde, 2 zombie horde, 1 zombie horde, go!” and then they are in play and can chase the humans.</li>
</ul>
</ghvz-rules-section>
 
<ghvz-rules-section title="Time Out">
For any reason, if a player is in an unsafe situation:
<ul>
<li>That player and all players near them are out of play.</li>
<li>The player should call “Time Out!” to tell anyone near them.</li>
<li>No infections/stuns count.</li>
<li>Once there are no players in danger, the humans say “3 resistance, 2 resistance, 1 resistance, go!” then they are in play and can run.</li>
<li>Once the humans say “go!”, the zombies, still out of play, will say “3 zombie horde, 2 zombie horde, 1 zombie horde, go!” and then they are in play and can chase the humans.</li>
</ul>
If this rule is not being respected, contact a moderator.
</ghvz-rules-section>
 
<ghvz-rules-section title="Out of Play">
If you find yourself in one of these areas, you are temporarily out of play until you leave the area. Please do not abuse these areas to escape zombies:
<ul>
<li>Inside, and 10 feet around any door leading outside</li>
<li>Any unsafe area, such as parking lots. Going into streets will get you banned.</li>
<li>Any crowded area, or anywhere that will bother working people</li>
<li>Outdoor dining and seating when non-players are present</li>
<li>Shuttle stops</li>
<li>When riding a bike</li>
</ul>
<ghvz-rules-collapsible title="Details">
Any player going inside or to a door during a mission BEFORE they have accomplished the objective has forfeited the mission.
</ghvz-rules-collapsible>
</ghvz-rules-section>
 
<ghvz-rules-section title="Moderators">
Moderators look like this and this is how you find them
</ghvz-rules-section>
 
<ghvz-rules-section title="Safe Zones">
<ul>
<li>Any circle of caution tape / cones set up by a moderator or a helper is a safe zone.</li>
<li>Zombies cannot stun or infect players from inside safe zones.</li>
<li>Humans can stun players from inside safe zones.</li>
</ul>
<ghvz-rules-collapsible title="Details">
<ul>
<li>Any player that has at least one foot inside the safe zone is considered to be in it.</li>
<li>Tags/Stuns made because of unsafe situations do not count.</li>
</ul>
</ghvz-rules-collapsible>
</ghvz-rules-section>
 
<ghvz-rules-section title="How to Not Get Banned">
<ul>
<li>Don’t ever go into streets, always use crosswalks!</li>
<li>Don’t bother people who are working!</li>
<li>Don’t shoot a non-player!</li>
<li>Do not involve non-players in the game. That means information, human shields, etc.</li>
<li>Obey all Moderator and Admin instructions.</li>
<li>Don’t be a jerk.</li>
<li>Don't intentionally create an unsafe situation.</li>
</ul>
</ghvz-rules-section>
`;

const FAQ_HTML = `
<p>Bacon ipsum dolor amet pancetta pork chop tail, boudin fatback chicken tri-tip hamburger meatball ball tip cupim pig doner. Cow prosciutto kielbasa ball tip tenderloin ribeye bresaola ham rump alcatra turkey. Chuck ham hock bacon bresaola pork loin shank, kevin pig. Biltong filet mignon pig strip steak pork loin pancetta sirloin bacon turkey pork kevin.</p>

<p>Corned beef shoulder bacon kevin, pork chop meatloaf capicola ham hock picanha doner pork brisket tongue fatback alcatra. Picanha beef salami, beef ribs andouille kevin rump jerky turducken spare ribs boudin pork loin drumstick shankle frankfurter. Picanha tongue brisket tri-tip, fatback hamburger leberkas short loin prosciutto rump biltong tenderloin pancetta kielbasa alcatra. Picanha fatback pancetta rump chicken beef. Doner rump salami t-bone short ribs filet mignon.</p>

<p>Kevin hamburger cow beef t-bone landjaeger tail, rump ribeye flank bacon venison pork belly burgdoggen. Pork loin chuck porchetta bacon drumstick ribeye ball tip corned beef. Meatball tri-tip pork shank short ribs pork chop. Flank fatback ribeye alcatra corned beef hamburger meatloaf ham sirloin doner filet mignon shankle leberkas. Burgdoggen rump corned beef ham brisket pork belly t-bone salami tenderloin. Strip steak meatball jerky sausage kevin chuck. Drumstick fatback ball tip, tri-tip pork belly pastrami pig tail tongue boudin pork cow meatball spare ribs.</p>

<p>Rump andouille pork belly short loin kielbasa capicola filet mignon tongue ball tip meatball short ribs. Pastrami shank ham hock biltong tongue, shoulder t-bone swine bresaola jowl turkey ground round sirloin boudin. Kevin pork chop short ribs filet mignon shoulder ham boudin flank prosciutto rump capicola sirloin. Cow ball tip pig shankle turducken bacon tenderloin sirloin. Frankfurter chuck capicola meatloaf boudin biltong andouille jowl picanha short ribs ribeye. Biltong fatback landjaeger, ham flank shoulder t-bone prosciutto hamburger tenderloin turkey ball tip jowl doner swine.</p>

<p>Jerky drumstick ham, rump ham hock filet mignon meatloaf leberkas prosciutto short loin frankfurter. Flank sirloin jerky turkey burgdoggen, bresaola tongue pancetta brisket beef ribs meatloaf. Alcatra t-bone picanha shank, pancetta porchetta frankfurter tenderloin salami rump ribeye turkey shankle. Corned beef kevin flank turkey ham pork chop frankfurter kielbasa short ribs. Venison picanha pork, pastrami kielbasa alcatra fatback rump.</p>
`;