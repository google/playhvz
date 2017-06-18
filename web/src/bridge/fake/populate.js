
function populateUsers(bridge, config) {
  let zellaUserId = 'user-' + config.fakeUserIds.zella;
  let reggieUserId = 'user-' + config.fakeUserIds.reggie;
  let minnyUserId = 'user-' + config.fakeUserIds.minny;
  let deckerdUserId = 'user-' + config.fakeUserIds.deckerd;
  let drakeUserId = 'user-' + config.fakeUserIds.drake;
  let moldaviUserId = 'user-' + config.fakeUserIds.moldavi;
  let zekeUserId = 'user-' + config.fakeUserIds.zeke;
  let jackUserId = 'user-' + config.fakeUserIds.jack;

  bridge.register({userId: zellaUserId});
  bridge.register({userId: reggieUserId});
  bridge.register({userId: minnyUserId});
  bridge.register({userId: drakeUserId});
  bridge.register({userId: zekeUserId});
  bridge.register({userId: moldaviUserId});
  bridge.register({userId: jackUserId});
  bridge.register({userId: deckerdUserId});
}

function makePlayerProperties(id, userId, gameId, time, name) {
  return {
    playerId: id,
    active: true,
    userId: userId,
    gameId: gameId,
    name: name,
    canInfect: false,
    needGun: false,
    beInPhotos: true,
    profileImageUrl: PlayerUtils.getDefaultProfilePic(name),
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

function populatePlayers(bridge, gameId, time, numPlayers, numStartingZombies, numDays, numShuffles) {
  let zombiesStartIndex = 0;
  let zombiesEndIndex = numStartingZombies;
  let gameStartOffset = time;
  let lifeCodeNumber = 1001;

  // For console logging only
  let numHumans = 0;
  let numZombies = numStartingZombies;

  // Make that many players, start that many of them as zombies, and simulate that
  // many days. In each of the days, each zombie infects a human.
  // Should end in zombiesEndIndex*(2^numDays) zombies.
  let playerIds = [];
  for (let i = 0; i < numPlayers; i++) {
    let userId = bridge.idGenerator.newUserId();
    bridge.register({userId: userId});
    let playerId = bridge.idGenerator.newPlayerId();
    bridge.createPlayer(makePlayerProperties(playerId, userId, gameId, time, 'Player' + i));
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = 0; i < zombiesEndIndex; i++) {
    bridge.joinHorde({
      gameId: gameId,
      serverTime: gameStartOffset,
      playerId: playerIds[i],
    });
  }
  for (let i = zombiesEndIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + lifeCodeNumber++;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;

    bridge.joinResistance({
      gameId: gameId,
      serverTime: gameStartOffset,
      playerId: playerIds[i],
      lifeId: bridge.idGenerator.newLifeId(),
      lifeCode: lifeCode,
    });
    // console.log("Adding first life to player", playerIds[i]);
    numHumans++;
  }
  // console.log(bridge.inner.time, numHumans, numZombies);
  for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
    let dayStartOffset = gameStartOffset + dayIndex * 24 * 60 * 60 * 1000; // 24 hours
    for (let j = zombiesStartIndex; j < zombiesEndIndex; j++) {
      let infectorId = playerIds[j];
      let victimId = playerIds[zombiesEndIndex + j];
      let victimLifeCode = lifeCodesByPlayerId[victimId];
      bridge.infect({
        gameId: gameId,
        serverTime: dayStartOffset + (j + 1) * 11 * 60 * 1000, // infections are spread by 11 minutes
        infectionId: bridge.idGenerator.newInfectionId(),
        infectorPlayerId: infectorId,
        victimLifeCode: victimLifeCode,
        victimPlayerId: null
      });
      // console.log("At", bridge.inner.time, "humans:", --numHumans, "zombies:", ++numZombies);
    }
    zombiesEndIndex *= 2;

    if (dayIndex == 0) {
      // End of first day, revive the starting zombies
      for (let j = 0; j < numStartingZombies; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        bridge.addLife({
          gameId: gameId,
          serverTime: dayStartOffset + 12 * 60 * 60 * 1000, // 12 hours past day start
          lifeId: bridge.idGenerator.newLifeId(),
          playerId: playerIds[j],
          lifeCode: lifeCode
        });
        // console.log("At", bridge.inner.time, "humans:", ++numHumans, "zombies:", --numZombies);
      }
      zombiesStartIndex = numStartingZombies;
    }
    if (dayIndex == 1) {
      // End of second day, revive a 3 random humans
      for (let j = zombiesStartIndex; j < zombiesStartIndex + 3; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        bridge.addLife({
          gameId: gameId,
          serverTime: dayStartOffset + 12 * 60 * 60 * 1000, // 12 hours past day start,
          lifeId: bridge.idGenerator.newLifeId(),
          playerId: playerIds[j],
          lifeCode: lifeCode
        });
        // console.log("At", bridge.inner.time, "humans:", ++numHumans, "zombies:", --numZombies);
      }
      zombiesStartIndex += 3;
    }
  }
}

function populatePlayersLight(bridge, gameId, time) {
  populatePlayers(bridge, gameId, time, 50, 7, 2, 3);
}

function populatePlayersHeavy(bridge, gameId, time) {
  populatePlayers(bridge, gameId, time, 300, 7, 5, 3);
}

function populateGame(bridge, gameId, config, populateLotsOfPlayers) {
  let zellaUserId = 'user-' + config.fakeUserIds.zella;
  let reggieUserId = 'user-' + config.fakeUserIds.reggie;
  let minnyUserId = 'user-' + config.fakeUserIds.minny;
  let deckerdUserId = 'user-' + config.fakeUserIds.deckerd;
  let drakeUserId = 'user-' + config.fakeUserIds.drake;
  let moldaviUserId = 'user-' + config.fakeUserIds.moldavi;
  let zekeUserId = 'user-' + config.fakeUserIds.zeke;
  let jackUserId = 'user-' + config.fakeUserIds.jack;

  bridge.createGame({
    gameId: gameId,
    serverTime: 1483257600000,
    adminUserId: zellaUserId,
    name: "Test game",
    rulesHtml: RULES_HTML,
    faqHtml: FAQ_HTML,
    stunTimer: 60,
    active: true,
    registrationEndTime: 1483286400000,
    startTime: 1483344000000,
    endTime: 1483689600000,
  });
  bridge.addDefaultProfileImage({
    gameId: gameId,
    defaultProfileImageId: bridge.idGenerator.newGroupId(),
    allegianceFilter: 'resistance',
    profileImageUrl: 'http://dfwresistance.us/images/resistance-dfw-icon.png',
  });
  bridge.addDefaultProfileImage({
    gameId: gameId,
    defaultProfileImageId: bridge.idGenerator.newGroupId(),
    allegianceFilter: 'resistance',
    profileImageUrl: 'https://cdn.vectorstock.com/i/thumb-large/03/81/1890381.jpg',
  });
  bridge.addDefaultProfileImage({
    gameId: gameId,
    defaultProfileImageId: bridge.idGenerator.newGroupId(),
    allegianceFilter: 'horde',
    profileImageUrl: 'https://goo.gl/DP2vlY',
  });
  bridge.addDefaultProfileImage({
    gameId: gameId,
    defaultProfileImageId: bridge.idGenerator.newGroupId(),
    allegianceFilter: 'horde',
    profileImageUrl: 'https://cdn4.iconfinder.com/data/icons/miscellaneous-icons-3/200/monster_zombie_hand-512.png',
  });

  let everyoneGroupId = bridge.idGenerator.newGroupId('everyone');
  let everyoneChatRoomId = bridge.idGenerator.newChatRoomId('everyone');
  bridge.createGroup({
    gameId: gameId,
    serverTime: 1483257600000,
    groupId: everyoneGroupId,
    name: "Everyone",
    ownerPlayerId: null,
    allegianceFilter: 'none',
    autoAdd: true,
    autoRemove: false,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: false,
    canRemoveSelf: false,
  });
  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483257600000,
    chatRoomId: everyoneChatRoomId,
    accessGroupId: everyoneGroupId,
    name: "Global Chat",
    withAdmins: false
  });

  var resistanceGroupId = bridge.idGenerator.newGroupId('resistance');
  bridge.createGroup({
    gameId: gameId,
    serverTime: 1483257600000,
    groupId: resistanceGroupId,
    name: "Resistance",
    ownerPlayerId: null,
    allegianceFilter: 'resistance',
    autoAdd: true,
    autoRemove: true,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: false,
    canRemoveSelf: false,
  });
  var resistanceChatRoomId = bridge.idGenerator.newChatRoomId('resistance');
  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483257600000,
    chatRoomId: resistanceChatRoomId,
    accessGroupId: resistanceGroupId,
    name: "Resistance Comms Hub",
    withAdmins: false
  });

  bridge.addAdmin({
    gameId: gameId,
    serverTime: 1483257600000,
    userId: minnyUserId
  });

  var zellaPlayerId = bridge.idGenerator.newPlayerId();
  bridge.createPlayer(makePlayerProperties(zellaPlayerId, zellaUserId, gameId, 1483257600000, 'ZellaTheUltimate'));
  bridge.joinResistance({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: zellaPlayerId,
    lifeCode: "glarple zerp wobbledob",
    lifeId: bridge.idGenerator.newLifeId()
  });

  var deckerdPlayerId = bridge.idGenerator.newPlayerId();
  bridge.createPlayer(makePlayerProperties(deckerdPlayerId, deckerdUserId, gameId, 1483257600000, 'DeckerdTheHesitant'));

  bridge.sendChatMessage({
    gameId: gameId,
    serverTime: 1483364000000,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: resistanceChatRoomId,
    playerId: zellaPlayerId,
    message: 'yo dawg i hear the zeds r comin!'
  });

  var hordeGroupId = bridge.idGenerator.newGroupId('horde');
  bridge.createGroup({
    groupId: hordeGroupId,
    name: "Horde",
    gameId: gameId,
    serverTime: 1483257600000,
    ownerPlayerId: null,
    allegianceFilter: 'horde',
    autoAdd: true,
    canAddOthers: true,
    autoRemove: true,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: false,
    canRemoveSelf: false,
  });
  var zedChatRoomId = bridge.idGenerator.newChatRoomId('horde');
  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483257600000,
    chatRoomId: zedChatRoomId,
    accessGroupId: hordeGroupId,
    name: "Horde ZedLink",
    withAdmins: false
  });

  var moldaviPlayerId = bridge.idGenerator.newPlayerId();
  bridge.addAdmin({
    gameId: gameId,
    serverTime: 1483257600000,
    userId: moldaviUserId
  });
  bridge.createPlayer(makePlayerProperties(moldaviPlayerId, moldaviUserId, gameId, 1483257600000, 'MoldaviTheMoldavish'));
  bridge.setAdminContact({
    gameId: gameId,
    serverTime: 1483257600000,
    playerId: moldaviPlayerId
  });
  bridge.joinResistance({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: moldaviPlayerId,
    lifeCode: "zooble flipwoogly",
    lifeId: null
  });
  
  var jackPlayerId = bridge.idGenerator.newPlayerId();
  bridge.createPlayer(makePlayerProperties(jackPlayerId, jackUserId, gameId, 1483257600000, 'JackSlayerTheBeanSlasher'));
  bridge.joinResistance({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: jackPlayerId, lifeCode: "grobble forgbobbly", lifeId: null});
  
  var drakePlayerId = bridge.idGenerator.newPlayerId();
  bridge.createPlayer(makePlayerProperties(drakePlayerId, drakeUserId, gameId, 1483257600000, 'Drackan'));
  bridge.joinHorde({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: drakePlayerId
  });

  var zekePlayerId = bridge.idGenerator.newPlayerId();
  bridge.createPlayer(makePlayerProperties(zekePlayerId, zekeUserId, gameId, 1483257600000, 'Zeke'));
  bridge.joinResistance({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: zekePlayerId, lifeCode: "bobblewob dobblewob", lifeId: null});

  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'man what i would do for some garlic rolls!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'https://www.youtube.com/watch?v=GrHPTWTSFgc'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});

  bridge.infect({
    infectionId: bridge.idGenerator.newInfectionId(),
    infectorPlayerId: drakePlayerId,
    victimLifeCode: "bobblewob dobblewob",
    victimPlayerId: null,
    gameId: gameId,
    serverTime: 1483364000000,
  });
  
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000,messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: zekePlayerId, message: 'zeds rule!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000,messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hoomans drool!'});
  bridge.sendChatMessage({gameId: gameId, serverTime: 1483364000000,messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'monkeys eat stool!'});

  var zedSecondChatRoomGroupId = bridge.idGenerator.newGroupId();
  var zedSecondChatRoomId = bridge.idGenerator.newChatRoomId();
  bridge.createGroup({
    groupId: zedSecondChatRoomGroupId,
    name: "Group for " + zedSecondChatRoomId,
    gameId: gameId,
    serverTime: 1483364000000,
    ownerPlayerId: zekePlayerId,
    allegianceFilter: 'horde',
    autoAdd: true,
    autoRemove: true,
    canAddOthers: true,
    canRemoveOthers: true,
    canAddSelf: true,
    canRemoveSelf: true,
  });
  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483364000000,
    chatRoomId: zedSecondChatRoomId,
    accessGroupId: zedSecondChatRoomGroupId,
    name: "Zeds Internal Secret Police",
    withAdmins: false,
  });

  bridge.addPlayerToGroup({
    gameId: gameId,
    serverTime: 1483364000000,
    groupId: zedSecondChatRoomGroupId,
    playerToAddId: zekePlayerId,
    actingPlayerId: zekePlayerId,
  });
  bridge.addPlayerToGroup({
    gameId: gameId,
    serverTime: 1483364000000,
    groupId: zedSecondChatRoomGroupId,
    playerToAddId: drakePlayerId,
    actingPlayerId: zekePlayerId,
  });
  bridge.sendChatMessage({
    gameId: gameId,
    serverTime: 1483364000000,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: zedSecondChatRoomId,
    playerId: drakePlayerId,
    message: 'lololol we be zed police'
  });
  bridge.sendChatMessage({
    gameId: gameId,
    serverTime: 1483364000000,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: zedSecondChatRoomId,
    playerId: zekePlayerId,
    message: 'lololol oink oink'
  });

  var resistanceSecondChatRoomGroupId = bridge.idGenerator.newGroupId();
  var resistanceSecondChatRoomId = bridge.idGenerator.newChatRoomId();
  bridge.createGroup({
    groupId: resistanceSecondChatRoomGroupId,
    name: "Group for " + resistanceSecondChatRoomId,
    gameId: gameId,
    serverTime: 1483364000000,
    ownerPlayerId: zellaPlayerId,
    allegianceFilter: 'resistance',
    autoAdd: false,
    autoRemove: true,
    canAddOthers: true,
    canRemoveOthers: true,
    canAddSelf: true,
    canRemoveSelf: true,
  });
  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483364000000,
    chatRoomId: resistanceSecondChatRoomId,
    accessGroupId: resistanceSecondChatRoomGroupId,
    name: "My Chat Room!",
    withAdmins: false
  });

  bridge.addPlayerToGroup({
    gameId: gameId,
    serverTime: 1483364000000,
    groupId: resistanceSecondChatRoomGroupId,
    playerToAddId: zellaPlayerId,
    actingPlayerId: zellaPlayerId,
  });
  bridge.sendChatMessage({
    gameId: gameId,
    serverTime: 1483364000000,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: resistanceSecondChatRoomId,
    playerId: zellaPlayerId,
    message: 'lololol i have a chat room!'
  });

  bridge.updatePlayer({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: zellaPlayerId,
    profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'
  });
  bridge.updatePlayer({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: drakePlayerId,
    profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'
  });
  bridge.updatePlayer({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: zekePlayerId,
    profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'
  });
  bridge.updatePlayer({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: moldaviPlayerId,
    profileImageUrl: 'https://katiekhau.files.wordpress.com/2012/05/scan-9.jpeg'
  });
  bridge.updatePlayer({
    gameId: gameId,
    serverTime: 1483364000000,
    playerId: jackPlayerId,
    profileImageUrl: 'https://sdl-stickershop.line.naver.jp/products/0/0/1/1009925/android/main.png'
  });

  var resistanceMapId = bridge.idGenerator.newMapId();
  bridge.createMap({gameId: gameId, mapId: resistanceMapId, accessGroupId: resistanceGroupId, name: "Resistance Players"});
  bridge.addMarker({markerId: bridge.idGenerator.newMarkerId(), name: "First Tower", color: "FF00FF", playerId: null, mapId: resistanceMapId, latitude: 37.423734, longitude: -122.092054});
  bridge.addMarker({markerId: bridge.idGenerator.newMarkerId(), name: "Second Tower", color: "00FFFF", playerId: null, mapId: resistanceMapId, latitude: 37.422356, longitude: -122.088078});
  bridge.addMarker({markerId: bridge.idGenerator.newMarkerId(), name: "Third Tower", color: "FFFF00", playerId: null, mapId: resistanceMapId, latitude: 37.422757, longitude: -122.081984});
  bridge.addMarker({markerId: bridge.idGenerator.newMarkerId(), name: "Fourth Tower", color: "FF8000", playerId: null, mapId: resistanceMapId, latitude: 37.420382, longitude: -122.083884});
  
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hi'});

  // if (populateLotsOfPlayers) {
  //   populatePlayersHeavy(bridge, gameId, 1483344000000);
  // } else {
  //   populatePlayersLight(bridge, gameId, 1483344000000);
  // }

  let firstMissionRsvpersGroupId = bridge.idGenerator.newMissionId();
  bridge.createGroup({
    groupId: firstMissionRsvpersGroupId,
    gameId: gameId,
    serverTime: 1483364000000,
    ownerPlayerId: null,
    allegianceFilter: 'resistance',
    name: 'rsvpers for first human mission!',
    autoAdd: false,
    autoRemove: true,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: true,
    canRemoveSelf: true,
  });

  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483364000000,
    chatRoomId: bridge.idGenerator.newChatRoomId(),
    name: "RSVPers for first human mission!",
    accessGroupId: firstMissionRsvpersGroupId,
    withAdmins: false,
  });

  var firstMissionId = bridge.idGenerator.newMissionId();
  bridge.addMission({
    missionId: firstMissionId,
    serverTime: 1483364000000,
    gameId: gameId,
    beginTime: new Date().getTime() - 10 * 1000,
    endTime: new Date().getTime() + 60 * 60 * 1000,
    name: "first human mission!",
    detailsHtml: HUMAN_MISSION_HTML,
    accessGroupId: resistanceGroupId,
    rsvpersGroupId: firstMissionRsvpersGroupId,
  });

  let zedMissionRsvpersGroupId = bridge.idGenerator.newMissionId();
  bridge.createGroup({
    groupId: zedMissionRsvpersGroupId,
    gameId: gameId,
    serverTime: 1483364000000,
    ownerPlayerId: null,
    allegianceFilter: 'horde',
    name: 'rsvpers for first zed mission',
    autoAdd: false,
    autoRemove: true,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: true,
    canRemoveSelf: true,
  });

  bridge.createChatRoom({
    gameId: gameId,
    serverTime: 1483364000000,
    chatRoomId: bridge.idGenerator.newChatRoomId(),
    name: "RSVPers for first zed mission!",
    accessGroupId: zedMissionRsvpersGroupId,
    withAdmins: false,
  });

  var zedMissionId = bridge.idGenerator.newMissionId();
  bridge.addMission({
    missionId: zedMissionId,
    gameId: gameId,
    serverTime: 1483364000000,
    beginTime: new Date().getTime() - 10 * 1000,
    endTime: new Date().getTime() + 60 * 60 * 1000,
    name: "first zed mission!",
    detailsHtml: ZOMBIE_MISSION_HTML,
    accessGroupId: hordeGroupId,
    rsvpersGroupId: zedMissionRsvpersGroupId,
  });

  var rewardCategoryId = bridge.idGenerator.newRewardCategoryId();
  bridge.addRewardCategory({
    rewardCategoryId: rewardCategoryId,
    gameId: gameId,
    serverTime: 1483257600000,
    name: "signed up!",
    points: 2,
    badgeImageUrl: 'https://maxcdn.icons8.com/Share/icon/ultraviolet/Baby//nerf_gun1600.png',
    shortName: "signed",
    description: 'signed up for the game!',
    limitPerPlayer: 1
  });
  bridge.addReward({
    gameId: gameId,
    serverTime: 1483257600000,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: rewardCategoryId,
    code: "signed-flarklebark",
  });
  bridge.addReward({
    gameId: gameId,
    serverTime: 1483257600000,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: rewardCategoryId,
    code: null
  });
  bridge.addReward({
    gameId: gameId,
    serverTime: 1483257600000,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: rewardCategoryId,
    code: null,
  });
  bridge.claimReward({
    gameId: gameId,
    serverTime: 1483257600000,
    playerId: drakePlayerId,
    rewardCode: "signed-flarklebark",
  });
  for (let i = 0; i < 80; i++) {
    bridge.addGun({gameId: gameId, serverTime: 1483257600000, gunId: bridge.idGenerator.newGunId(), label: "" + (1404 + i)});
  }

  bridge.sendNotification({
    gameId: gameId,
    serverTime: 1483364000000,
    queuedNotificationId: bridge.idGenerator.newQueuedNotificationId(),
    previewMessage: "Mission 1 Details: the zeds have invaded!",
    message: "oh god theyre everywhere run",
    sendTime: null,
    groupId: resistanceGroupId,
    playerId: null,
    email: true,
    site: true,
    mobile: true,
    vibrate: true,
    sound: true,
    destination: "missions/" + firstMissionId,
    icon: null
  });

  let requestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let requestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    serverTime: 1483364000000,
    requestCategoryId: requestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'yee?',
    type: 'ack',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: requestId,
    requestCategoryId: requestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: requestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: requestId,
    text: null
  });
  bridge.updateRequestCategory({
    gameId: gameId,
    serverTime: 1483364000000,
    requestCategoryId: requestCategoryId,
    dismissed: true,
  });

  let secondRequestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let secondRequestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    serverTime: 1483364000000,
    requestCategoryId: secondRequestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'yee2?',
    type: 'ack',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: secondRequestId,
    requestCategoryId: secondRequestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: secondRequestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: secondRequestId,
    text: null
  });

  let textRequestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let textRequestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    serverTime: 1483364000000,
    requestCategoryId: textRequestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'text?',
    type: 'text',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: textRequestId,
    requestCategoryId: textRequestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: textRequestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    serverTime: 1483364000000,
    requestId: textRequestId,
    text: "responseText",
  });
  
  populateQuiz(bridge, gameId);
}

function populateQuiz(bridge, gameId) {
  let stunQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: stunQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "When you're a zombie, and a human shoots you with a nerf dart, what do you do?",
    type: 'order',
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Stand up, return to mauling humans,",
    order: 3,
    isCorrect: true,
    number: 3,
  });

  let infectQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "When you're a zombie, and you touch a human, what do you do?",
    type: 'order',
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Ask the human for their life code,",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 3,
    isCorrect: true,
    number: 3,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Stand up, return to mauling humans,",
    order: 4,
    isCorrect: true,
    number: 4,
  });

  let crossQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "When you want to cross the street, what do you do?",
    type: 'order',
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Get within 15 feet of a crosswalk button (now you're out of play),",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Press the crosswalk button,",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "When the walk signal appears, walk (not run) across the crosswalk,",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Wait until there are no more players in the crosswalk,",
    order: 3,
    isCorrect: true,
    number: 3,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
    order: 4,
    isCorrect: true,
    number: 4,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "When the humans go, have a zombie count \"3 zombie horde, 2 zombie horde, 1 zombie horde, go!\" and the zombies are in play,",
    order: 5,
    isCorrect: true,
    number: 5,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
    order: 0,
    isCorrect: false,
    number: 6,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Count to 15, then take off your armband,",
    order: 0,
    isCorrect: false,
    number: 7,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Raise your nerf gun in the air so you're visible,",
    order: 0,
    isCorrect: false,
    number: 8,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    serverTime: 1483364000000,
    text: "Start walking across the street, looking both ways for cars,",
    order: 0,
    isCorrect: false,
    number: 9,
  });
  bridge.executeNotifications({});
}

// const HUMAN_MISSION_HTML = 'mmm human mission';

// const ZOMBIE_MISSION_HTML = 'mmm brains mission';

// const FAQ_HTML = 'i am faq';

// const RULES_HTML = 'i am rules';


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

const FAQ_HTML = `
<b>I am a FAQ!</b>
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