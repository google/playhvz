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
    privatePlayerId: null,
    isActive: true,
    userId: userId,
    gameId: gameId,
    name: name,
    canInfect: false,
    needGun: false,
    beInPhotos: true,
    profileImageUrl: PlayerUtils.getDefaultProfilePic(name),
    wantToBeSecretZombie: false,
    volunteer: {
      advertising: false,
      logistics: false,
      communications: true,
      moderator: false,
      cleric: false,
      sorcerer: false,
      admin: false,
      photographer: false,
      chronicler: true,
      android: true,
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

function populatePlayers(bridge, gameId, gameStartOffset, numPlayers, numStartingZombies, numRevivesPerDay, numDays, numShuffles, timeBetweenInfections) {
  let zombiesStartIndex = 0;
  let zombiesEndIndex = numStartingZombies;
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
    let playerId = bridge.idGenerator.newPublicPlayerId();
    bridge.createPlayer(makePlayerProperties(playerId, userId, gameId, gameStartOffset, 'Player' + i));
    playerIds.push(playerId);
  }
  playerIds = Utils.deterministicShuffle(playerIds, numShuffles);
  let lifeCodesByPlayerId = {};
  for (let i = 0; i < zombiesEndIndex; i++) {
    bridge.joinHorde({
      gameId: gameId,
      playerId: playerIds[i],
    });
  }
  for (let i = zombiesEndIndex; i < playerIds.length; i++) {
    let lifeCode = "life-" + lifeCodeNumber++;
    lifeCodesByPlayerId[playerIds[i]] = lifeCode;

    bridge.joinResistance({
      gameId: gameId,
      playerId: playerIds[i],
      lifeId: bridge.idGenerator.newPublicLifeId(),
      privateLifeId: bridge.idGenerator.newPrivateLifeId(),
      lifeCode: lifeCode,
    });
    // console.log("Adding first life to player", playerIds[i]);
    numHumans++;
  }
  // console.log(bridge.inner.time, numHumans, numZombies);
  for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
    let dayStartOffset = gameStartOffset + dayIndex * 24 * 60 * 60 * 1000; // 24 hours
    bridge.setRequestTimeOffset(dayStartOffset);
    for (let j = zombiesStartIndex; j < zombiesEndIndex; j++) {
      let infectorId = playerIds[j];
      let victimId = playerIds[zombiesEndIndex + j];
      let victimLifeCode = lifeCodesByPlayerId[victimId];
      let infectionTimeOffset = dayStartOffset + (j + 1) * timeBetweenInfections; // infections are spread by 11 minutes
      // console.log('infecting', victimId, 'at', infectionTimeOffset);
      bridge.setRequestTimeOffset(infectionTimeOffset);
      bridge.infect({
        gameId: gameId,
        infectionId: bridge.idGenerator.newInfectionId(),
        infectorPlayerId: infectorId,
        victimLifeCode: victimLifeCode,
        victimPlayerId: null
      });
      // console.log("At", bridge.inner.time, "humans:", --numHumans, "zombies:", ++numZombies);
    }
    zombiesEndIndex *= 2;

    if (dayIndex == 0) {
      // End of each day, revive some humans
      for (let j = zombiesStartIndex; j < zombiesStartIndex + numRevivesPerDay; j++) {
        let lifeCode = "life-" + lifeCodeNumber++;
        lifeCodesByPlayerId[playerIds[j]] = lifeCode;
        let reviveTimeOffset = dayStartOffset + 12 * 60 * 60 * 1000; // 12 hours past day start
        bridge.setRequestTimeOffset(reviveTimeOffset);
        // console.log('reviving', playerIds[j], 'at', reviveTimeOffset);
        bridge.addLife({
          gameId: gameId,
          lifeId: bridge.idGenerator.newPublicLifeId(),
          privateLifeId: null,
          playerId: playerIds[j],
          lifeCode: lifeCode
        });
        // console.log("At", bridge.inner.time, "humans:", ++numHumans, "zombies:", --numZombies);
      }
      zombiesStartIndex += numRevivesPerDay;
    }
  }
}

function populatePlayersLight(bridge, gameId, gameStartOffset) {
  populatePlayers(bridge, gameId, gameStartOffset, 20, 2, 2, 2, 3, 60 * 60 * 1000);
}

function populatePlayersHeavy(bridge, gameId, gameStartOffset) {
  populatePlayers(bridge, gameId, gameStartOffset, 300, 7, 6, 5, 3, 11 * 60 * 1000);
}

function populateGame(bridge, gameId, config, populateLotsOfPlayers) {
  let gameStartOffset = - 6 * 24 * 60 * 60 * 1000; // 6 days ago
  bridge.setRequestTimeOffset(gameStartOffset);

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
    adminUserId: zellaUserId,
    name: "Test game",
    rulesHtml: RULES_HTML,
    faqHtml: FAQ_HTML,
    summaryHtml: SUMMARY_HTML,
    stunTimer: 60,
    isActive: true,
    registrationEndTime: 1483286400000,
    startTime: 1483344000000,
    endTime: 1483689600000,
    declareHordeEndTime: 1583286400000,
    declareResistanceEndTime: 1583286400000,
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
    chatRoomId: everyoneChatRoomId,
    accessGroupId: everyoneGroupId,
    name: "Global Chat",
    withAdmins: false
  });

  var resistanceGroupId = bridge.idGenerator.newGroupId('resistance');
  bridge.createGroup({
    gameId: gameId,
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
    chatRoomId: resistanceChatRoomId,
    accessGroupId: resistanceGroupId,
    name: "Resistance Comms Hub",
    withAdmins: false
  });

  bridge.addAdmin({
    gameId: gameId,
    userId: minnyUserId
  });

  var zellaPlayerId = bridge.idGenerator.newPublicPlayerId();
  bridge.createPlayer(makePlayerProperties(zellaPlayerId, zellaUserId, gameId, 1483257600000, 'ZellaTheUltimate'));
  bridge.joinResistance({
    gameId: gameId,
    playerId: zellaPlayerId,
    lifeCode: "glarple-zerp-wobbledob",
    lifeId: bridge.idGenerator.newPublicLifeId(),
    privateLifeId: null,
  });

  var deckerdPlayerId = bridge.idGenerator.newPublicPlayerId();
  bridge.createPlayer(makePlayerProperties(deckerdPlayerId, deckerdUserId, gameId, 1483257600000, 'DeckerdTheHesitant'));

  bridge.sendChatMessage({
    gameId: gameId,
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
    chatRoomId: zedChatRoomId,
    accessGroupId: hordeGroupId,
    name: "Horde ZedLink",
    withAdmins: false
  });

  var moldaviPlayerId = bridge.idGenerator.newPublicPlayerId();
  bridge.addAdmin({
    gameId: gameId,
    userId: moldaviUserId
  });
  bridge.createPlayer(makePlayerProperties(moldaviPlayerId, moldaviUserId, gameId, 1483257600000, 'MoldaviTheMoldavish'));
  bridge.setAdminContact({
    gameId: gameId,
    playerId: moldaviPlayerId
  });
  bridge.updatePlayer({
    gameId: gameId,
    playerId: moldaviPlayerId,
    gotEquipment: true,
    notes: 'captain of stradivarius',
  });
  bridge.joinResistance({
    gameId: gameId,
    playerId: moldaviPlayerId,
    lifeCode: "zooble-flipwoogly",
    lifeId: null,
    privateLifeId: null,
  });

  var jackPlayerId = bridge.idGenerator.newPublicPlayerId();
  let jackProperties = makePlayerProperties(jackPlayerId, jackUserId, gameId, 1483257600000, 'JackSlayerTheBeanSlasher');
  jackProperties.wantToBeSecretZombie = true;
  bridge.createPlayer(jackProperties);
  bridge.joinResistance({
    gameId: gameId,
    playerId: jackPlayerId,
    lifeCode: "grobble-forgbobbly",
    lifeId: null,
    privateLifeId: null,
  });

  var drakePlayerId = bridge.idGenerator.newPublicPlayerId();
  bridge.createPlayer(makePlayerProperties(drakePlayerId, drakeUserId, gameId, 1483257600000, 'Drackan'));
  bridge.joinHorde({
    gameId: gameId,
    playerId: drakePlayerId
  });

  var zekePlayerId = bridge.idGenerator.newPublicPlayerId();
  bridge.createPlayer(makePlayerProperties(zekePlayerId, zekeUserId, gameId, 1483257600000, 'Zeke'));
  bridge.joinResistance({
    gameId: gameId,
    playerId: zekePlayerId,
    lifeCode: "bobblewob-dobblewob",
    lifeId: null,
    privateLifeId: null,
  });

  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'man what i would do for some garlic rolls!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'https://www.youtube.com/watch?v=GrHPTWTSFgc'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});

  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: moldaviPlayerId, message: 'yee!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: resistanceChatRoomId, playerId: jackPlayerId, message: 'yee!'});

  bridge.infect({
    infectionId: bridge.idGenerator.newInfectionId(),
    infectorPlayerId: drakePlayerId,
    victimLifeCode: "bobblewob-dobblewob",
    victimPlayerId: null,
    gameId: gameId,
  });

  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: zekePlayerId, message: 'zeds rule!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hoomans drool!'});
  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'monkeys eat stool!'});

  var zedSecondChatRoomGroupId = bridge.idGenerator.newGroupId();
  var zedSecondChatRoomId = bridge.idGenerator.newChatRoomId();
  bridge.createGroup({
    groupId: zedSecondChatRoomGroupId,
    name: "Group for " + zedSecondChatRoomId,
    gameId: gameId,
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
    chatRoomId: zedSecondChatRoomId,
    accessGroupId: zedSecondChatRoomGroupId,
    name: "Zeds Internal Secret Police",
    withAdmins: false,
  });

  bridge.addPlayerToGroup({
    gameId: gameId,
    groupId: zedSecondChatRoomGroupId,
    playerToAddId: zekePlayerId,
    actingPlayerId: zekePlayerId,
  });
  bridge.addPlayerToGroup({
    gameId: gameId,
    groupId: zedSecondChatRoomGroupId,
    playerToAddId: drakePlayerId,
    actingPlayerId: zekePlayerId,
  });
  bridge.sendChatMessage({
    gameId: gameId,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: zedSecondChatRoomId,
    playerId: drakePlayerId,
    message: 'lololol we be zed police'
  });
  bridge.sendChatMessage({
    gameId: gameId,
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
    chatRoomId: resistanceSecondChatRoomId,
    accessGroupId: resistanceSecondChatRoomGroupId,
    name: "My Chat Room!",
    withAdmins: false
  });

  bridge.addPlayerToGroup({
    gameId: gameId,
    groupId: resistanceSecondChatRoomGroupId,
    playerToAddId: zellaPlayerId,
    actingPlayerId: zellaPlayerId,
  });
  bridge.sendChatMessage({
    gameId: gameId,
    messageId: bridge.idGenerator.newMessageId(),
    chatRoomId: resistanceSecondChatRoomId,
    playerId: zellaPlayerId,
    message: 'lololol i have a chat room!'
  });

  bridge.updatePlayer({
    gameId: gameId,
    playerId: zellaPlayerId,
    profileImageUrl: 'https://lh3.googleusercontent.com/GoKTAX0zAEt6PlzUkTn7tMeK-q1hwKDpzWsMJHBntuyR7ZKVtFXjRkbFOEMqrqxPWJ-7dbCXD7NbVgHd7VmkYD8bDzsjd23XYk0KyALC3BElIk65vKajjjRD_X2_VkLPOVejrZLpPpa2ebQVUHJF5UXVlkst0m6RRqs2SumRzC7EMmEeq9x_TurwKUJmj7PhNBPCeoDEh51jAIc-ZqvRfDegLgq-HtoyJAo91lbD6jqA2-TFufJfiPd4nOWnKhZkQmarxA8LQT0kOu7r3M5F-GH3pCbQqpH1zraha8CqvKxMGLW1i4CbDs1beXatKTdjYhb1D_MVnJ6h7O4WX3GULwNTRSIFVOrogNWm4jWLMKfKt3NfXYUsCOMhlpAI3Q8o1Qgbotfud4_HcRvvs6C6i17X-oQm8282rFu6aQiLXOv55FfiMnjnkbTokOA1OGDQrkBPbSVumz9ZE3Hr-J7w_G8itxqThsSzwtK6p5YR_9lnepWe0HRNKfUZ2x-a2ndT9m6aRXC_ymWHQGfdGPvTfHOPxUpY8mtX2vknmj_dn4dIuir1PpcN0DJVVuyuww3sOn-1YRFh80gBFvwFuMnKwz8GY8IX5gZmbrrBsy_FmwFDIvBcwNjZKd9fH2gkK5rk1AlWv12LsPBsrRIEaLvcSq7Iim9XSsiivzcNrLFG=w294-h488-no'
  });
  bridge.updatePlayer({
    gameId: gameId,
    playerId: drakePlayerId,
    profileImageUrl: 'https://lh3.googleusercontent.com/WP1fewVG0CvERcnQnmxjf84IjnEBoDQBgdaxbNAECRa433neObfAjv_xI35DN67WhcCL9y-mgXmfYrZEBeJ2PYrtIeCK3KSdJ4HiEDUqxaaGsJAtu5C5ZjcABUHoySueEwO0yJWfhWPVbGoAFdP-ZquoXSF3yz4gnlN76W-ltDBglclLxKs-hR9dTjf_DiX9yGmmb5y8mp1Jb8BEw9Q-zx_j9EFkgTI0EA6T10pogxsfAWkrwXO7t37D0vI2OxzHJA51EQ4LZw1oZsIN7Uyqnh06LAJ_ykYhW2xuSCpu7QY7UPm9IbDcsDqj1eap7xvV9JW_EW2Y8Km5nS0ZoAd-Eo3zUe-2YFTc0OAVDwgbhowzo1gUeqfCEtxVHuT36Aq2LWayB6DzOL9TqubcF7qmjtNy_UIr-RY1d69xN-KqjFBoWLtS6rDhQurrfJNd5x-MYOEjCMrbsGmSXE8L7PskM3e_3-ZhIqfMn2I-4zeEZIUG8U2iHRWK-blaqsSY8uhmzNG6sqF-liyINagQF4l35oy7tpobueWs7aDjRrcJrGiQDrGHYV1E67J64Ae9FqXPHmORRpYcihQc6pI0JAmaiWwMJoqD0QMJF9koaDYANPEGbWlnWc_lFzhCO_L8yCkVtJIIItQv-loypR6XqILK32eoGeatnp5Q0x0OEm3W=s240-no'
  });
  bridge.updatePlayer({
    gameId: gameId,
    playerId: zekePlayerId,
    profileImageUrl: 'https://s-media-cache-ak0.pinimg.com/736x/31/92/2e/31922e8b045a7ada368f774ce34e20c0.jpg'
  });
  bridge.updatePlayer({
    gameId: gameId,
    playerId: moldaviPlayerId,
    profileImageUrl: 'https://katiekhau.files.wordpress.com/2012/05/scan-9.jpeg'
  });
  bridge.updatePlayer({
    gameId: gameId,
    playerId: jackPlayerId,
    profileImageUrl: 'https://sdl-stickershop.line.naver.jp/products/0/0/1/1009925/android/main.png'
  });

  var resistanceMapId = bridge.idGenerator.newMapId();
  bridge.createMap({gameId: gameId, requestTrackingUntil: new Date().getTime() + gameStartOffset, mapId: resistanceMapId, accessGroupId: resistanceGroupId, name: "Resistance Players"});
  bridge.addMarker({gameId: gameId, markerId: bridge.idGenerator.newMarkerId(), name: "First Tower", color: "FF00FF", playerId: null, mapId: resistanceMapId, latitude: 37.423734, longitude: -122.092054});
  bridge.addMarker({gameId: gameId, markerId: bridge.idGenerator.newMarkerId(), name: "Second Tower", color: "00FFFF", playerId: null, mapId: resistanceMapId, latitude: 37.422356, longitude: -122.088078});
  bridge.addMarker({gameId: gameId, markerId: bridge.idGenerator.newMarkerId(), name: "Third Tower", color: "FFFF00", playerId: null, mapId: resistanceMapId, latitude: 37.422757, longitude: -122.081984});
  bridge.addMarker({gameId: gameId, markerId: bridge.idGenerator.newMarkerId(), name: "Fourth Tower", color: "FF8000", playerId: null, mapId: resistanceMapId, latitude: 37.420382, longitude: -122.083884});

  bridge.sendChatMessage({gameId: gameId, messageId: bridge.idGenerator.newMessageId(), chatRoomId: zedChatRoomId, playerId: drakePlayerId, message: 'hi'});

  if (populateLotsOfPlayers) {
    populatePlayersHeavy(bridge, gameId, gameStartOffset);
  } else {
    populatePlayersLight(bridge, gameId, gameStartOffset);
  }

  let firstMissionRsvpersGroupId = bridge.idGenerator.newMissionId();
  bridge.createGroup({
    groupId: firstMissionRsvpersGroupId,
    gameId: gameId,
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
    chatRoomId: bridge.idGenerator.newChatRoomId(),
    name: "RSVPers for first human mission!",
    accessGroupId: firstMissionRsvpersGroupId,
    withAdmins: false,
  });

  var firstMissionId = bridge.idGenerator.newMissionId();
  bridge.addMission({
    missionId: firstMissionId,
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
    chatRoomId: bridge.idGenerator.newChatRoomId(),
    name: "RSVPers for first zed mission!",
    accessGroupId: zedMissionRsvpersGroupId,
    withAdmins: false,
  });

  var zedMissionId = bridge.idGenerator.newMissionId();
  bridge.addMission({
    missionId: zedMissionId,
    gameId: gameId,
    beginTime: new Date().getTime() + 60 * 60 * 1000,
    endTime: new Date().getTime() + 120 * 60 * 1000,
    name: "first zed mission!",
    detailsHtml: ZOMBIE_MISSION_HTML,
    accessGroupId: hordeGroupId,
    rsvpersGroupId: zedMissionRsvpersGroupId,
  });

  var firstRewardCategoryId = bridge.idGenerator.newRewardCategoryId();
  bridge.addRewardCategory({
    rewardCategoryId: firstRewardCategoryId,
    gameId: gameId,
    name: "signed up!",
    points: 2,
    badgeImageUrl: 'https://maxcdn.icons8.com/Share/icon/ultraviolet/Baby//nerf_gun1600.png',
    shortName: "signed",
    description: 'signed up for the game!',
    limitPerPlayer: 1
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: firstRewardCategoryId,
    code: "signed-flarklebark",
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: firstRewardCategoryId,
    code: null
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: firstRewardCategoryId,
    code: null,
  });

  var secondRewardCategoryId = bridge.idGenerator.newRewardCategoryId();
  bridge.addRewardCategory({
    rewardCategoryId: secondRewardCategoryId,
    gameId: gameId,
    name: "did the thing!",
    points: 2,
    badgeImageUrl: 'https://s-media-cache-ak0.pinimg.com/originals/94/9b/80/949b80956f246b74dc1f4f1f476eb9c1.png',
    shortName: "didthing",
    description: 'soooo did the thing!',
    limitPerPlayer: 1
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: secondRewardCategoryId,
    code: "didthing-flarklebark",
  });

  var thirdRewardCategoryId = bridge.idGenerator.newRewardCategoryId();
  bridge.addRewardCategory({
    rewardCategoryId: thirdRewardCategoryId,
    gameId: gameId,
    name: "found a leaf!",
    points: 2,
    badgeImageUrl: 'http://static.tumblr.com/87e20377c9c37d0b07dcc10504c636a8/mteq5q3/k1Ynitn6h/tumblr_static_75lgqkjlvcw00cos8g8kko80k.png',
    shortName: "foundleaf",
    description: 'i found a leaf when my allies were being ambushed!',
    limitPerPlayer: 1
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: thirdRewardCategoryId,
    code: "foundleaf-flarklebark",
  });

  var fourthRewardCategoryId = bridge.idGenerator.newRewardCategoryId();
  bridge.addRewardCategory({
    rewardCategoryId: fourthRewardCategoryId,
    gameId: gameId,
    name: "i know geno!",
    points: 2,
    badgeImageUrl: 'http://vignette2.wikia.nocookie.net/nintendo/images/0/02/Geno_Artwork_%28Super_Mario_RPG_-_Legend_of_the_Seven_Stars%29.png/revision/latest?cb=20121110130550&path-prefix=en',
    shortName: "knowgeno",
    description: 'i know who geno is!',
    limitPerPlayer: 1
  });
  bridge.addReward({
    gameId: gameId,
    rewardId: bridge.idGenerator.newRewardId(),
    rewardCategoryId: fourthRewardCategoryId,
    code: "knowgeno-flarklebark",
  });

  bridge.claimReward({
    gameId: gameId,
    playerId: drakePlayerId,
    rewardCode: "signed-flarklebark",
  });
  bridge.claimReward({
    gameId: gameId,
    playerId: drakePlayerId,
    rewardCode: "didthing-flarklebark",
  });
  bridge.claimReward({
    gameId: gameId,
    playerId: drakePlayerId,
    rewardCode: "foundleaf-flarklebark",
  });
  bridge.claimReward({
    gameId: gameId,
    playerId: drakePlayerId,
    rewardCode: "knowgeno-flarklebark",
  });
  for (let i = 0; i < 80; i++) {
    bridge.addGun({gameId: gameId, gunId: bridge.idGenerator.newGunId(), label: "" + (1404 + i)});
  }

  bridge.sendNotification({
    gameId: gameId,
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
    sound: "ping.wav",
    destination: "missions/" + firstMissionId,
    icon: null
  });

  let requestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let requestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    requestCategoryId: requestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'yee?',
    type: 'ack',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: requestId,
    requestCategoryId: requestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: requestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    requestId: requestId,
    text: null
  });
  bridge.updateRequestCategory({
    gameId: gameId,
    requestCategoryId: requestCategoryId,
    dismissed: true,
  });

  let secondRequestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let secondRequestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    requestCategoryId: secondRequestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'yee2?',
    type: 'ack',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: secondRequestId,
    requestCategoryId: secondRequestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: secondRequestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    requestId: secondRequestId,
    text: null
  });

  let textRequestCategoryId = bridge.idGenerator.newRequestCategoryId();
  let textRequestId = bridge.idGenerator.newRequestId();
  bridge.addRequestCategory({
    gameId: gameId,
    requestCategoryId: textRequestCategoryId,
    chatRoomId: resistanceChatRoomId,
    playerId: moldaviPlayerId,
    text: 'text?',
    type: 'text',
    dismissed: false
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: textRequestId,
    requestCategoryId: textRequestCategoryId,
    playerId: jackPlayerId
  });
  bridge.addRequest({
    gameId: gameId,
    requestId: bridge.idGenerator.newRequestId(),
    requestCategoryId: textRequestCategoryId,
    playerId: zellaPlayerId
  });
  bridge.addResponse({
    gameId: gameId,
    requestId: textRequestId,
    text: "responseText",
  });

  populateQuiz(bridge, gameId);
}

function populateQuiz(bridge, gameId) {
  let stunQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: stunQuestionId, gameId: gameId,
    text: "When you're a zombie, and a human shoots you with a nerf dart, what do you do?",
    type: 'order',
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: stunQuestionId, gameId: gameId,
    text: "Stand up, return to mauling humans,",
    order: 3,
    isCorrect: true,
    number: 3,
  });

  let infectQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: infectQuestionId, gameId: gameId,
    text: "When you're a zombie, and you touch a human, what do you do?",
    type: 'order',
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    text: "Crouch/sit down,",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    text: "Ask the human for their life code,",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    text: "For 50 seconds, don't move from your spot (unless safety requires it),",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    text: "Count aloud \"10, 9, 8, 7, 6, 5, 4, 3, 2, 1\",",
    order: 3,
    isCorrect: true,
    number: 3,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: infectQuestionId, gameId: gameId,
    text: "Stand up, return to mauling humans,",
    order: 4,
    isCorrect: true,
    number: 4,
  });

  let crossQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: crossQuestionId, gameId: gameId,
    text: "When you want to cross the street, what do you do?",
    type: 'order',
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Get within 15 feet of a crosswalk button (now you're out of play),",
    order: 0,
    isCorrect: true,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Press the crosswalk button,",
    order: 1,
    isCorrect: true,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "When the walk signal appears, walk (not run) across the crosswalk,",
    order: 2,
    isCorrect: true,
    number: 2,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Wait until there are no more players in the crosswalk,",
    order: 3,
    isCorrect: true,
    number: 3,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Have a human count \"3 resistance, 2 resistance, 1 resistance, go!\" and the humans are in play,",
    order: 4,
    isCorrect: true,
    number: 4,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "When the humans go, have a zombie count \"3 zombie horde, 2 zombie horde, 1 zombie horde, go!\" and the zombies are in play,",
    order: 5,
    isCorrect: true,
    number: 5,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Once you're across, count \"3 resistance, 2 resistance, 1 resistance!\" and go,",
    order: 0,
    isCorrect: false,
    number: 6,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Count to 15, then take off your armband,",
    order: 0,
    isCorrect: false,
    number: 7,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Raise your nerf gun in the air so you're visible,",
    order: 0,
    isCorrect: false,
    number: 8,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: crossQuestionId, gameId: gameId,
    text: "Start walking across the street, looking both ways for cars,",
    order: 0,
    isCorrect: false,
    number: 9,
  });

  let lyingDownQuestionId = bridge.idGenerator.newQuizQuestionId();
  bridge.addQuizQuestion({quizQuestionId: lyingDownQuestionId, gameId: gameId,
    text: "You see somebody lying down, not moving. What should you do?",
    type: 'multipleChoice',
    number: 3,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: lyingDownQuestionId, gameId: gameId,
    text: "Keep playing",
    order: 0,
    isCorrect: false,
    number: 0,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: lyingDownQuestionId, gameId: gameId,
    text: "Let an admin know",
    order: 0,
    isCorrect: false,
    number: 1,
  });
  bridge.addQuizAnswer({quizAnswerId: bridge.idGenerator.newQuizAnswerId(), quizQuestionId: lyingDownQuestionId, gameId: gameId,
    text: "Check that they’re ok, and call 911/GSOC if they’re unresponsive.",
    order: 0,
    isCorrect: true,
    number: 2,
  });

  bridge.setRequestTimeOffset(0);
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

const SUMMARY_HTML = `
<b>I am a SUMMARY!</b>
`;

const RULES_HTML = `
<div>Additional rules and clarifications might be added before game, send any questions to hvz-cdc@</div>
<div>Admins may change rules as the game goes on. Keep an eye out for updates!</div>
<div>So long as you follow the rules, you’re free to play however you like, including playing deceptively or lying.</div>
<div><b>If any rules conflict with safety, do the safe thing!</b></div>

<ghvz-rules-section title="Game Identification, Life Code">
<ul>
<li>Each player will be given a strip of pink cloth to identify them as a player, each human will be given a life code.</li>
<li>Humans wear their band visibly on their arm, zombies wear them visibly around their head.</li>
<li>Upon being infected by a zombie, the human gives the zombie their life code.</li>
<li>Moderators will have orange armbands.</li>
</ul>
</ghvz-rules-section>

<ghvz-rules-section title="Infecting">
<div>A Zombie can turn humans to zombies with a firm touch to any part of a Human including anything they are wearing and anything they are holding (unless it is an admin given shield or pool noodle). Please don't tackle!</div>
<div>When infected:</div>
<ul>
<li>Both players are now zombies, and are stunned for 1 minute.</li>
<li>The zombie must collect the victim's life code, and report the infection on the site as soon as they can.</li>
<li>The victim must move their armband to their head.</li>
<li>The zombies must count the last 10 seconds aloud.</li>
<li>After the minute is up, both players return to the game as zombies.</li>
</ul>
<ghvz-rules-collapsible title="Details">
<ul>
<li>Zombies may be given pool noodles that act as an extension of their arm, at the discretion of moderators only.</li>
<li>If there is any confusion or dispute, contact the moderator.</li>
<li>There will be 1 mission a day. Miss two consecutive missions and you will automatically become infected. Humans that complete the Friday mission survive the game.</li>
</ul>
</ghvz-rules-collapsible>
</ghvz-rules-section>

<ghvz-rules-section title="Stunning">
<div>Humans can stun ANY player (humans or zombie) for 1 minute by shooting them with a nerf dart, hitting them with a sock they threw, or tagging them with an admin given pool noodle. When stunned, the player must:</div>
<div>When stunned:</div>
<ul>
<li>Crouch/sit down, and not move from their spot for 1 minute, or sooner (for humans) if unstunned.</li>
<li>Count the last 10 seconds aloud.</li>
<li>When the minute is up, stand up and return to the game.</li>
</ul>
<ghvz-rules-collapsible title="Details">
<ul>
<li>Humans that were stunned by other humans are vulnerable to zombies while waiting to become unstunned (but they can still shoot).</li>
<li>If you have a functionally modded blaster, email hvz-cdc@ to get it approved. Let a moderator know if someone’s blaster is painful.</li>
<li>Don’t stuff things in the socks, just roll them up.</li>
<li>Admins may add more methods of stunning as the game goes on.</li>
<li>Zombies cannot sit down near a human unless the zombie is stunned.</li>
<li>If a stunned player is in an unsafe situation or is inconveniencing non-players, they must walk to the nearest safe location, then sit down and begin their counter from the start.</li>
<li>A stunned player may not be stunned again to restart their timer.</li>
<li>Players can block a stun with an admin-given shield or noodle.</li>
<li>Admins might change the stun timer during the game or add areas players can go to respawn.</li>
<li>Once a dart hits the ground, any player can pick it up and use it.</li>
<li>Please pick up any darts you find (even if they’re not yours)</li>
<li>No player may take another player’s nerf blaster without permission from the owner. Any humans borrowing a loaner blaster can only give it to a moderator, NOT another player to return for them.</li>
</ul>
</ghvz-rules-collapsible>
</ghvz-rules-section>

<ghvz-rules-section title="Unstunning">
Any human can “unstun” any stunned human by touching them.
</ghvz-rules-section>

<ghvz-rules-section title="Secret Zombie">
<div>Secret zombies are human in every way, except when a secret zombie touches a human:</div>
<ul>
<li>Both players crouch/sit down are stunned for 1 minute.</li>
<li>The possessed human gets the victim's life code, and report the infection on the site as soon as they can.</li>
<li>The possessed human becomes a regular zombie and so must move the bandanna to their head.</li>
<li>The victim becomes the new possessed human and so keeps the bandanna on their arm.</li>
<li>They must count the last 10 seconds of their stun aloud.</li>
<li>When the minute is up, they both stand up and resume playing.</li>
</ul>
</ghvz-rules-section>

<ghvz-rules-section title="Crossing streets">
<div>There are many streets in the playable area for the game so please play away from traffic and use this protocol when using crosswalks:</div>
<ul>
<li>Once you get within 15 feet of the crosswalk button, you’re out of play (can’t be infected/stunned, can’t infect/stun).</li>
<li>Press the button.</li>
<li>Once walk sign appears, everyone (humans and zombies) must walk (not run) across the crosswalk.</li>
<li>Once there are no players still in the crosswalk, the humans say “3 resistance, 2 resistance, 1 resistance, go!” then they are in play and can run.</li>
<li>Once the humans say “go!”, the zombies, still out of play, will say “3 zombie horde, 2 zombie horde, 1 zombie horde, go!” and then they are in play and can chase the humans.</li>
</ul>
<div>No looking at cell phones in cross walks!</div>
</ghvz-rules-section>

<ghvz-rules-section title="Time Out">
<div>For any reason, if a player is in an unsafe situation, that player and all players near them are out of play. The player should call “Time Out!” to tell anyone near them. No infections/stuns count.</div>
<ul>
<li>If you hear someone yell “Time out!”, or see anyone with their first on head, put your fist on your head.</li>
<li>If it’s time out, and you see someone without their fist on their head, yell “Time out!”</li>
</ul>
<div>Once there are no players in danger:</div>
<ul>
<li>Humans say “3 resistance, 2 resistance, 1 resistance, go!” then they are in play and can run.</li>
<li>Once the humans say “go!”, the zombies, still out of play, will say “3 zombie horde, 2 zombie horde, 1 zombie horde, go!” and then they are in play and can chase the humans.</li>
</ul>
<div>If this rule is not being respected, contact a moderator.</div>
</ghvz-rules-section>

<ghvz-rules-section title="Out of Play">
<ul>
<li>A player is playing the game (“in play”) whenever they have their armband/headband on, otherwise, they are not playing at the time (“out of play”).</li>
<li>A player can only put the armband/headband on, or take it off, at a door. Combined with the rule above, this means that one can only enter/leave the game at any Google door.</li>
</ul>
<div>If you find yourself in one of these areas, you are temporarily out of play until you leave the area. Please do not abuse these areas to escape zombies:</div>
<ul>
<li>Inside, and 10 feet around any door</li>
<li>Any unsafe area, such as parking lots. Going into streets will get you banned.</li>
<li>Any crowded area, or anywhere that will bother working people</li>
<li>Outdoor dining and seating when non-players are present</li>
<li>Shuttle stops</li>
<li>When riding a bike</li>
</ul>
<ghvz-rules-collapsible title="Details">
<div>Any player going inside or to a door during a mission BEFORE they have accomplished the objective has forfeited the mission.</div>
<div>No player can be infected or stunned before 9am or after 8:00pm.</div>
<div>Tags/Stuns made because of unsafe situations do not count.</div>
</ghvz-rules-collapsible>
</ghvz-rules-section>

<ghvz-rules-section title="Safe Zones">
Any circle of cones set up by a moderator or a helper is a safe zone. Zombies cannot stun or infect players from inside safe zones. Humans can stun players from inside safe zones. Any player that has at least one foot inside the safe zone is considered to be in it.
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
