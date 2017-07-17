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

// Common functions needed for chat, like create chat room.


class ChatUtils {}

/**
 * Create a new chat room.
 *
 * @returns the id of the new chat room. Note that this does not mean the chat room exists yet, 
 *   just that we've request for a chat room with this id to be created by the server.
 */
 ChatUtils.createChatRoom = function(bridge, gameId, playerId, chatRoomName, userSetProperties) {
  assert(chatRoomName);

  let propertyDefaults = {
    'autoAdd': false,
    'autoRemove': false,
    'allegianceFilter': 'none',
    'canAddOthers': true,
    'canRemoveOthers': true,
  };

  let properties = Utils.merge(propertyDefaults, userSetProperties);

  let groupId = bridge.newGroupId();
  let chatRoomId = bridge.newChatRoomId();
  bridge.createGroup({
    name: "Group for " + playerId + "'s chat room",
    gameId: gameId,
    groupId: groupId,
    ownerPlayerId: playerId,
    allegianceFilter: properties.allegianceFilter,
    autoAdd: properties.autoAdd,
    autoRemove: properties.autoRemove,
    canAddOthers: properties.canAddOthers,
    canRemoveOthers: properties.canRemoveOthers,
    canAddSelf: false,
    canRemoveSelf: true,
  }).then(() => {
    return bridge.createChatRoom({
      gameId: gameId,
      chatRoomId: chatRoomId,
      accessGroupId: groupId,
      name: chatRoomName,
      withAdmins: false,
    });
  }).then(() => {
    return bridge.addPlayerToGroup({
      gameId: gameId,
      groupId: groupId,
      playerToAddId: playerId,
      actingPlayerId: playerId,
    });
  })
  return chatRoomId;
};

/**
 * Create a chat room between the player and the admin point of contact.
 *
 * @returns the id of the new chat room. Note that this does not mean the chat room exists yet, 
 *   just that we've request for a chat room with this id to be created by the server.
 */
ChatUtils.createAdminChat = function(bridge, game, player, chatRoomName) {
  let name =  player.name + " & HvZ CDC";
  let groupId = bridge.newGroupId('withadmins');
  bridge.createGroup({
    name: name,
    groupId: groupId,
    gameId: game.id,
    allegianceFilter: 'none',
    ownerPlayerId: player.id,
    autoAdd: false,
    autoRemove: false,
    canAddOthers: false,
    canRemoveOthers: false,
    canAddSelf: true,
    canRemoveSelf: true,
  });
  let chatRoomId = bridge.newChatRoomId('withadmins');
  this.waitingToOpenChatRoomId = chatRoomId;
  bridge.createChatRoom({
    gameId: game.id,
    chatRoomId: chatRoomId,
    accessGroupId: groupId,
    name: name,
    withAdmins: true,
  });
  bridge.addPlayerToGroup({
    gameId: game.id,
    groupId: groupId,
    playerToAddId: player.id,
    actingPlayerId: player.id,
  });
  bridge.addPlayerToGroup({
    gameId: game.id,
    groupId: groupId,
    playerToAddId: game.adminContactPlayerId,
    actingPlayerId: player.id,
  });
  return chatRoomId;
};

/**
* Given a chat room and the players membership status, see if that chat room is visible
*/ 
ChatUtils.chatIsHidden = function(chatRoom, membership) {
  if (!membership) {
    return true;
  }
  let lastHiddenTime = membership.lastHiddenTime;
  if (!lastHiddenTime)
    return false;
  // If we get here, then it was at some point in the past hidden
  if (!chatRoom.messages.length) {
    // It was hidden at some point in the past, but there are no messages. Weird. Hide it.
    return true;
  }
  let lastMessage = chatRoom.messages.slice(-1)[0];
  if (lastHiddenTime > lastMessage.time) {
    // If we get here, we hid it after the last message, so we shouldnt show it
    return true;
  } else {
    // If we get here, we hid it before the last message, so we should show it
    return false;
  }
}

