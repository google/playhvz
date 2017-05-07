
function makePlayerProperties(id, userId, gameId, name) {
  return {
    playerId: id,
    userId: userId,
    gameId: gameId,
    name: name,
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
    phone: null,
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
    let userId = Bridge.UserId.generate();
    server.register({userId: userId, name: "User " + i});
    let playerId = Bridge.PlayerId.generate();
    server.createPlayer(makePlayerProperties(playerId, userId, gameId, 'Player' + i));
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = zombiesEndIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + lifeCodeNumber++;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;
    server.addLife({lifeId: Bridge.LifeId.generate(), playerId: playerIds[i], code: lifeCode});
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
      server.infect({infectionId: Bridge.InfectionId.generate(), playerId: infectorId, infecteeLifeCode: infecteeLifeCode});
      // console.log(server.time, --numHumans, ++numZombies);
    }
    zombiesEndIndex *= 2;

    if (i == 0) {
      // End of first day, revive the starting zombies
      server.inner.setTime(dayStartTimestamp + i * 12 * 60 * 60 * 1000); // 12 hours past day start
      for (let j = 0; j < numStartingZombies; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        server.addLife({lifeId: Bridge.LifeId.generate(), playerId: playerIds[j], code: lifeCode});
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
        server.addLife({lifeId: Bridge.LifeId.generate(), playerId: playerIds[j], code: lifeCode});
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

function populateFakeServer(server, isRegistered, isAdmin, isJoined) {
  // registered, admin, and joined
  var kimUserId = Bridge.UserId.generate();
  server.register({userId: kimUserId, name: "Kim"});
  // registered, thats it
  let reggieUserId = Bridge.UserId.generate();
  server.register({userId: reggieUserId, name: "Reggie"});
  // registered and is admin, not joined
  let minnyUserId = Bridge.UserId.generate();
  server.register({userId: minnyUserId, name: "Minny"});
  // registered and joined
  var evanUserId = Bridge.UserId.generate();
  server.register({userId: evanUserId, name: "Evan"});
  // just some other zombie dude in a chat room...
  var zekeUserId = Bridge.UserId.generate();
  server.register({userId: zekeUserId, name: "Zeke"});
  // Just some other human dude in a chat room...
  var moldaviUserId = Bridge.UserId.generate();
  server.register({userId: moldaviUserId, name: "Moldavi"});

  var gameId = "game-2017m";
  server.createGame({gameId: gameId, firstAdminUserId: kimUserId, name: "Test game", rulesHtml: "<b>Dont be a deck</b>", stunTimer: 60, active: true});

  var resistanceGroupId = Bridge.GroupId.generate('resistance');
  server.createGroup({groupId: resistanceGroupId, gameId: gameId, ownerPlayerId: null, allegianceFilter: 'resistance', autoAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var resistanceChatRoomId = Bridge.ChatRoomId.generate();
  server.createChatRoom({chatRoomId: resistanceChatRoomId, groupId: resistanceGroupId, name: "Resistance Comms Hub", withAdmin: false});

  var hordeGroupId = Bridge.GroupId.generate('horde');
  server.createGroup({groupId: hordeGroupId, gameId: gameId, ownerPlayerId: null, allegianceFilter: 'horde', autoAdd: true, membersCanAdd: true, autoRemove: true, membersCanAdd: false, membersCanRemove: false});
  var zedChatRoomId = Bridge.ChatRoomId.generate();
  server.createChatRoom({chatRoomId: zedChatRoomId, groupId: hordeGroupId, name: "Horde ZedLink", withAdmin: false});

  server.addAdmin({gameId: gameId, userId: minnyUserId});

  var kimPlayerId = Bridge.PlayerId.generate();
  server.createPlayer(makePlayerProperties(kimPlayerId, kimUserId, gameId, 'Kim the Ultimate'));
  server.joinResistance({playerId: kimPlayerId}, "glarple zerp wobbledob");

  var moldaviPlayerId = Bridge.PlayerId.generate();
  server.addAdmin({gameId: gameId, userId: moldaviUserId});
  server.createPlayer(makePlayerProperties(moldaviPlayerId, moldaviUserId, gameId, 'Moldavi'));
  server.setAdminContact({gameId: gameId, playerId: moldaviPlayerId});
  server.joinResistance({playerId: moldaviPlayerId}, "zooble flipwoogly");
  
  var evanPlayerId = Bridge.PlayerId.generate();
  server.createPlayer(makePlayerProperties(evanPlayerId, evanUserId, gameId, 'Evanpocalypse'));
  server.joinHorde({playerId: evanPlayerId});

  var zekePlayerId = Bridge.PlayerId.generate();
  server.createPlayer(makePlayerProperties(zekePlayerId, zekeUserId, gameId, 'Zeke'));
  server.joinHorde({playerId: zekePlayerId});

  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: resistanceChatRoomId, playerId: kimPlayerId, message: 'yo dawg i hear the zeds r comin!'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'man what i would do for some garlic rolls!'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'https://www.youtube.com/watch?v=GrHPTWTSFgc'});

  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedChatRoomId, playerId: zekePlayerId, message: 'zeds rule!'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'hoomans drool!'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'monkeys eat stool!'});

  var zedSecondChatRoomGroupId = Bridge.GroupId.generate();
  server.createGroup({groupId: zedSecondChatRoomGroupId, gameId: gameId, ownerPlayerId: zekePlayerId, allegianceFilter: 'horde', autoAdd: true, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  var zedSecondChatRoomId = Bridge.ChatRoomId.generate();
  server.createChatRoom({chatRoomId: zedSecondChatRoomId, groupId: zedSecondChatRoomGroupId, name: "Zeds Internal Secret Police", withAdmin: false});

  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, playerToAddId: zekePlayerId});
  server.addPlayerToGroup({groupId: zedSecondChatRoomGroupId, playerId: null, playerToAddId: evanPlayerId});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedSecondChatRoomId, playerId: evanPlayerId, message: 'lololol we be zed police'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedSecondChatRoomId, playerId: zekePlayerId, message: 'lololol oink oink'});

  var resistanceSecondChatRoomGroupId = Bridge.GroupId.generate();
  server.createGroup({groupId: resistanceSecondChatRoomGroupId, gameId: gameId, ownerPlayerId: kimPlayerId, allegianceFilter: 'resistance', autoAdd: false, autoRemove: true, membersCanAdd: true, membersCanRemove: true});
  var resistanceSecondChatRoomId = Bridge.ChatRoomId.generate();
  server.createChatRoom({chatRoomId: resistanceSecondChatRoomId, groupId: resistanceSecondChatRoomGroupId, name: "My Chat Room!", withAdmin: false});

  server.addPlayerToGroup({groupId: resistanceSecondChatRoomGroupId, playerId: null, playerToAddId: kimPlayerId});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: resistanceSecondChatRoomId, playerId: kimPlayerId, message: 'lololol i have a chat room!'});

  server.updatePlayer({playerId: kimPlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'});
  server.updatePlayer({playerId: evanPlayerId, profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'});
  server.updatePlayer({playerId: zekePlayerId, profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'});
  server.sendChatMessage({messageId: Bridge.MessageId.generate(), chatRoomId: zedChatRoomId, playerId: evanPlayerId, message: 'hi'});

  if (Utils.getParameterByName('populate', 'light') == 'heavy') {
    populatePlayersHeavy(server, gameId);
  } else {
    populatePlayersLight(server, gameId);
  }

  var firstMissionId = Bridge.MissionId.generate();
  server.addMission({missionId: firstMissionId, gameId: gameId, beginTime: new Date().getTime() - 10 * 1000, endTime: new Date().getTime() + 60 * 60 * 1000, name: "first mission!", detailsHtml: HUMAN_MISSION_HTML, groupId: resistanceGroupId});
  var secondMissionId = Bridge.MissionId.generate();
  server.addMission({missionId: secondMissionId, gameId: gameId, beginTime: new Date().getTime() - 10 * 1000, endTime: new Date().getTime() + 60 * 60 * 1000, name: "second mission!", detailsHtml: ZOMBIE_MISSION_HTML, groupId: hordeGroupId});
  var rewardCategoryId = Bridge.RewardCategoryId.generate();
  server.addRewardCategory({rewardCategoryId: rewardCategoryId, gameId: gameId, name: "signed up!", points: 2, seed: "derp"});
  server.addReward({gameId: gameId, rewardId: Bridge.RewardId.generate(), rewardCategoryId: rewardCategoryId});
  server.addReward({gameId: gameId, rewardId: Bridge.RewardId.generate(), rewardCategoryId: rewardCategoryId});
  server.addReward({gameId: gameId, rewardId: Bridge.RewardId.generate(), rewardCategoryId: rewardCategoryId});
  // server.claimReward(evanPlayerId, "flarklebark");
  for (let i = 0; i < 80; i++) {
    server.addGun({gunId: "gun-" + 1404 + i});
  }
  let mission1AlertNotificationCategoryId = Bridge.NotificationCategoryId.generate();
  server.addNotificationCategory({notificationCategoryId: mission1AlertNotificationCategoryId, gameId: gameId, name: "mission 1 alert", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "oh god theyre everywhere run", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/missions/" + firstMissionId, icon: null});
  server.addNotification({gameId: gameId, notificationId: Bridge.NotificationId.generate(), playerId: kimPlayerId, notificationCategoryId: mission1AlertNotificationCategoryId, previewMessage: null, message: null, email: true, app: null, vibrate: null, sound: null, destination: null, icon: null});
  let chatNotificationCategoryId = Bridge.NotificationCategoryId.generate();
  server.addNotificationCategory({notificationCategoryId: chatNotificationCategoryId, gameId: gameId, name: "chat notifications", previewMessage: "Mission 1 Details: the zeds have invaded!", message: "blark flibby wopdoodle shorply gogglemog", sendTime: new Date().getTime() + 60 * 60 * 1000, allegianceFilter: "resistance", email: true, app: true, vibrate: true, sound: true, destination: null, icon: null});
  server.addNotification({gameId: gameId, notificationId: Bridge.NotificationId.generate(), playerId: kimPlayerId, notificationCategoryId: chatNotificationCategoryId, previewMessage: "Ping from Evanpocalypse!", message: "blark flibby wopdoodle shorply gogglemog", email: true, app: true, vibrate: true, sound: true, destination: "/2017m/chat/" + resistanceChatRoomId, icon: null});

  let stunQuestionId = Bridge.QuizQuestionId.generate();
  server.addQuizQuestion({quizQuestionId: stunQuestionId, gameId: gameId,
    text: "When you're a zombie, and a human shoots you with a nerf dart, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: stunQuestionId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: stunQuestionId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: stunQuestionId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: stunQuestionId,
    text: "Stand up, return to mauling humans,",
    order: 3,
    isCorrect: true,
  });

  let infectQuestionId = Bridge.QuizQuestionId.generate();
  server.addQuizQuestion({quizQuestionId: infectQuestionId, gameId: gameId,
    text: "When you're a zombie, and you touch a human, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: infectQuestionId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: infectQuestionId,
    text: "Ask the human for their life code,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: infectQuestionId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: infectQuestionId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: infectQuestionId,
    text: "Stand up, return to mauling humans,",
    order: 4,
    isCorrect: true,
  });

  let crossQuestionId = Bridge.QuizQuestionId.generate();
  server.addQuizQuestion({quizQuestionId: crossQuestionId, gameId: gameId,
    text: "When you want to cross the street, what do you do?",
    type: 'order',
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Count to 15, then take off your armband,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Raise your nerf gun in the air so you're visible,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Start walking across the street, looking both ways for cars,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Get within 15 feet of a crosswalk button (now you're out of play),",
    order: 0,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Press the crosswalk button,",
    order: 1,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "When the walk signal appears, walk (not run) across the crosswalk,",
    order: 2,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
    order: 0,
    isCorrect: false,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Wait until there are no more players in the crosswalk,",
    order: 3,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
    text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
    order: 4,
    isCorrect: true,
  });
  server.addQuizAnswer({quizAnswerId: Bridge.QuizAnswerId.generate(), quizQuestionId: crossQuestionId,
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