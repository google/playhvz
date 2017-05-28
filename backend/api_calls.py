import logging
import random
import time
import textwrap

import constants
import db_helpers as helpers
import secrets


InvalidInputError = helpers.InvalidInputError


# Used for trawling the full DB.
ROOT_ENTRIES = (
    'chatRooms', 'games', 'groups', 'guns', 'missions', 'playersPrivate', 'playersPublic',
    'users', 'rewardCategories', 'rewards', 'notifications')


def Register(request, firebase):
  """Register a new user in the DB.

  Validation:
  Args:
    userId: Unique userId added to the user list.
    name: A name to use to reference a player.

  Firebase entries:
    /users/%(userId)
  """
  helpers.ValidateInputs(request, firebase, {
    'userId': 'String'
  })

  user_id = request['userId']

  if firebase.get('/users', user_id) is None:
    data = {'a': True}
    return firebase.put('/users', request['userId'], data)


def AddGame(request, firebase):
  """Add a new game.

  Validation:
    gameId must be valid format.

  Args:
    gameId:
    adminUserId:
    name:
    rulesHtml: static HTML containing the rule doc.
    stunTimer:

  Firebase entries:
    /games/%(gameId)
  """
  results = []
  helpers.ValidateInputs(request, firebase, {
    'gameId': '!GameId',
    'adminUserId': 'UserId',
    'name': 'String',
    'rulesHtml': 'String',
    'stunTimer': 'Number',
    'active': 'Boolean',
  })

  put_data = {
    'name': request['name'],
    'rulesHtml': request['rulesHtml'],
    'stunTimer': request['stunTimer'],
    'active': request['active'],
  }
  results.append(firebase.put('/games', request['gameId'], put_data))
  results.append(firebase.put('/games/%s/adminUsers' % request['gameId'], request['adminUserId'], True))
  return results


def SetAdminContact(request, firebase):
  """Update a game entry.

  Validation:

  Args:
    gameId:
    playerId:

  Firebase entries:
    /games/%(gameId)/a
  """
  valid_args = ['gameId', 'playerId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_data = {'adminContactPlayerId': request['playerId']}
  return firebase.patch('/games/%s' % request['gameId'], put_data)


def UpdateGame(request, firebase):
  """Update a game entry.

  Validation:

  Args:
    gameId:
    name (optional):
    rulesHtml (optional):
    stunTimer (optional):

  Firebase entries:
    /games/%(gameId)
  """
  valid_args = ['gameId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'name': '|String',
    'rulesHtml': '|String',
    'stunTimer': '|Number',
    'active': '|Boolean'
  })

  put_data = {}
  for property in ['name', 'rulesHtml', 'stunTimer']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/games/%s' % request['gameId'], put_data)


def AddGameAdmin(request, firebase):
  """Add an admin to a game.

  Validation:

  Args:
    gameId:
    userId:

  Firebase entries:
    /games/%(gameId)/adminUsers
  """

  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'userId': 'UserId'
  })

  game = request['gameId']
  user = request['userId']

  if firebase.get('/games/%s/adminUsers' % game, user):
    raise InvalidInputError('User %s is already an admin.' % user)

  return firebase.put('/games/%s/adminUsers/' % game, user, True)


def AddGroup(request, firebase):
  """Add a new player group.

  Validation:

  Args:
    groupId: New ID to use to create the group.
    gameId: The game associated with this group.
    name: Group name.
    allegianceFilter: Which allegiance this group is associated with.
    autoAdd: Automatically add players to this group based on allegiance.
    autoRemove: Automatically remove players to this group based on allegiance.
    membersCanAdd: Group members can add other players.
    membersCanRemove: Group members can add other players.
    ownerPlayerId: (optional) player who is the owner of this group.

  Firebase entries:
    /groups/%(groupId)
    /groups/%(groupId)/players/%(playerId)
    /games/%(gameId)/groups/%(groupId)
  """
  helpers.ValidateInputs(request, firebase, {
    'groupId': '!GroupId',
    'gameId': 'GameId',
    'ownerPlayerId': '?PlayerId',
    'allegianceFilter': 'String',
    'name': 'String',
    'autoRemove': 'Boolean',
    'autoAdd': 'Boolean',
    'membersCanAdd': 'Boolean',
    'membersCanRemove': 'Boolean'
  })

  group_id = request['groupId']
  owner_player_id = request['ownerPlayerId']

  group = {
    'ownerPlayerId': owner_player_id,
    'gameId': request['gameId'],
    'allegianceFilter': request['allegianceFilter'],
    'name': request['name'],
    'autoRemove': request['autoRemove'],
    'autoAdd': request['autoAdd'],
    'membersCanAdd': request['membersCanAdd'],
    'membersCanRemove': request['membersCanRemove'],
  }

  firebase.put('/groups', group_id, group)
  firebase.put('/games/%s/groups/' % request['gameId'], request['groupId'], True)
  if request['ownerPlayerId'] is not None:
    AddPlayerToGroupInner(firebase, group_id, owner_player_id)
  # TODO We may need to populate a group automatically on creation.


def UpdateGroup(request, firebase):
  """Update a group entry.

  Validation:

  Args:
    groupId:
    name (optional):
    autoAdd (optional):
    autoRemove (optional):
    membersCanAdd (optional):
    membersCanRemove (optional):
    ownerPlayerId (optional):

  Firebase entries:
    /groups/%(groupId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'groupId': 'GroupId',
    'ownerPlayerId': '|PlayerId',
    'name': '|String',
    'autoAdd': '|Boolean',
    'autoRemove': '|Boolean',
    'membersCanAdd': '|Boolean',
    'membersCanRemove': '|Boolean'
  })

  put_data = {}
  for property in ['name', 'autoAdd', 'autoRemove', 'membersCanAdd', 'membersCanRemove', 'ownerPlayerId']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/groups/%s' % request['groupId'], put_data)


def AddPlayer(request, firebase):
  """Add a new player for a user and put that player into the game.

  Player data gets sharded between /playersPublic/%(playerId)
  and /playersPrivate/%(playerId) for public and private info about players.
  The latter can be used to map a playerId to a gameId.

  Firebase entries:
    /games/%(gameId)/players
    /playersPublic/%(playerId)
    /playersPrivate/%(playerId)
    /users/%(userId)/players/%(playerId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'userId': 'UserId',
    'playerId': '!PlayerId',
    'active': 'Boolean',
    'name': 'String',
    'needGun': 'Boolean',
    'canInfect': 'Boolean',
    'profileImageUrl': '?String',
    'gotEquipment': 'Boolean',
    'notes': 'String',
    'startAsZombie': 'String',
    'beSecretZombie': 'String',
    'notificationSettings': {
      'sound': 'Boolean',
      'vibrate': 'Boolean',
    },
    'volunteer': {
      'advertising': 'Boolean',
      'logistics': 'Boolean',
      'communications': 'Boolean',
      'moderator': 'Boolean',
      'cleric': 'Boolean',
      'sorcerer': 'Boolean',
      'admin': 'Boolean',
      'photographer': 'Boolean',
      'chronicler': 'Boolean',
      'server': 'Boolean',
      'client': 'Boolean',
      'android': 'Boolean',
      'ios': 'Boolean'
    }
  })

  results = []

  game_id = request['gameId']
  player_id = request['playerId']
  user_id = request['userId']

  number = helpers.GetNextPlayerNumber(firebase, game_id)

  user_player = {'gameId': game_id}
  results.append(firebase.put('/users/%s/players' % user_id, player_id, user_player))

  private_player = {
    'gameId': game_id,
    'userId': user_id,
    'canInfect': request['canInfect'],
    'notes': request['notes'],
    'needGun' : request['needGun'],
    'gotEquipment' : request['gotEquipment'],
    'startAsZombie' : request['startAsZombie'],
    'wantsToBeSecretZombie': request['beSecretZombie'],
    'notificationSettings': request['notificationSettings'],
    'volunteer': request['volunteer'],
  }
  results.append(firebase.put('/playersPrivate', player_id, private_player))

  public_player = {
    'number': number,
    'userId' : user_id,
    'name': request['name'],
    'profileImageUrl' : request['profileImageUrl'],
    'active': request['active'],
    'points': 0,
    'allegiance': constants.NO_ALLEGIANCE,
  }
  results.append(firebase.put('/playersPublic', player_id, public_player))

  results.append(firebase.put('/games/%s/players' % game_id, player_id, True))

  AutoUpdatePlayerGroups(firebase, player_id, new_player=True)

  return results


def UpdatePlayer(request, firebase):
  """Update player properties.
  Firebase entries:
    /playersPrivate/%(playerId)
    /playersPublic/%(playerId)
  """

  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'playerId': 'PlayerId',
    'active': '|Boolean',
    'name': '|String',
    'needGun': '|Boolean',
    'profileImageUrl': '|?String',
    'gotEquipment': '|Boolean',
    'notes': '|String',
    'startAsZombie': '|String',
    'beSecretZombie': '|String',
    'notificationSettings': {
      'sound': '|Boolean',
      'vibrate': '|Boolean',
    },
   'volunteer': {
      'advertising': '|Boolean',
      'logistics': '|Boolean',
      'communications': '|Boolean',
      'moderator': '|Boolean',
      'cleric': '|Boolean',
      'sorcerer': '|Boolean',
      'admin': '|Boolean',
      'photographer': '|Boolean',
      'chronicler': '|Boolean',
      'server': '|Boolean',
      'client': '|Boolean',
      'android': '|Boolean',
      'ios': '|Boolean'
    }
  })

  player_id = request['playerId']

  public_update = {}
  for property in ['active', 'name', 'profileImageUrl']:
    if property in request:
      public_update[property] = request[property]

  volunteer_update = {}
  if 'volunteer' in request:
    for property in constants.PLAYER_VOLUNTEER_ARGS:
      if property in request['volunteer']:
        volunteer_update[property] = request['volunteer'][property]

  notification_settings_update = {}
  if 'notificationSettings' in request:
    for property in ['vibrate', 'sound']:
      if property in request['notificationSettings']:
        notification_settings_update[property] = request['notificationSettings'][property]

  private_update = {}
  for property in ['needGun', 'gotEquipment', 'notes', 'startAsZombie', 'beSecretZombie']:
    if property in request:
      private_update[property] = request[property]

  print "patching public:"
  print public_update
  print "patching private:"
  print private_update

  firebase.patch('/playersPrivate/%s' % player_id, private_update)
  firebase.patch('/playersPrivate/%s/volunteer' % player_id, volunteer_update)
  firebase.patch('/playersPrivate/%s/notificationSettings' % player_id, notification_settings_update)
  firebase.patch('/playersPublic/%s' % player_id, public_update)


def AddGun(request, firebase):
  """Add a new gun to the DB.

  Firebase entries:
    /guns/%(gunId)/
  """
  helpers.ValidateInputs(request, firebase, {
    'gunId': '!GunId',
    'label': 'String'
  })

  return firebase.put('/guns', request['gunId'], {'playerId': '', 'label': request['label']})


def AssignGun(request, firebase):
  """Assign a gun to a given player.

  Firebase entries:
    /guns/%(gunId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gunId': 'GunId',
    'playerId': '|?PlayerId',
  })

  update = {}
  if 'playerId' in request:
    update['playerId'] = request['playerId'] or ''

  print 'gun id is' + request['gunId']
  return firebase.patch('/guns/%s' % request['gunId'], update)


def AddMission(request, firebase):
  """Add a new mission.

  Validation:

  Args:
    missionId:
    groupId:
    name:
    begin:
    end:
    detailsHtml:

  Firebase entries:
    /missions/%(missionId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'missionId': '!MissionId',
    'groupId': 'GroupId',
    'name': 'String',
    'beginTime': 'Timestamp',
    'endTime': 'Timestamp',
    'detailsHtml': 'String'
  })

  mission_data = {k: request[k] for k in ['name', 'beginTime', 'endTime', 'detailsHtml', 'groupId', 'gameId']}

  firebase.put('/missions', request['missionId'], mission_data)
  firebase.put('/games/%s/missions' % request['gameId'], request['missionId'], True)


def UpdateMission(request, firebase):
  """Update details of a mission.

  Firebase entries:
    /missions/%(missionId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'missionId': 'MissionId',
    'name': '|String',
    'beginTime': '|Timestamp',
    'endTime': '|Timestamp',
    'detailsHtml': '|String'
  })

  mission_id = request['missionId']

  put_data = {}
  for property in ['name', 'begin', 'end', 'detailsHtml']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/missions/%s' % mission_id, put_data)


def AddChatRoom(request, firebase):
  """Add a new chat room.
  Use the chatRoomId to make a new chat room.
  Add the chatRoomId to the game's list of chat rooms.
  Validation:
  Args:
    chatRoomId: Id to use for this chat room.
    groupId:
    name: Chat room name, can be updated.
    withAdmins: bool, used by the client.
  Firebase entries:
    /chatRooms/%(chatRoomId)
    /games/%(gameId)/chatRooms
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'chatRoomId': '!ChatRoomId',
    'groupId': 'GroupId',
    'withAdmins': 'Boolean',
    'name': 'String'
  })

  chat_room_id = request['chatRoomId']
  game_id = request['gameId']

  chat_room = {k: request[k] for k in ('groupId', 'name', 'withAdmins', 'gameId')}
  
  firebase.put('/chatRooms', chat_room_id, chat_room)
  firebase.put('/games/%s/chatRooms' % game_id, chat_room_id, True)


def UpdateChatRoom(request, firebase):
  """Update a chat room.

  Validation:

  Args:
    chatRoomId: Chat room ID
    name: Chat room name (optional)

  Firebase entries:
    /chatRooms/%(chatRoomId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'chatRoomId': 'ChatRoomId',
    'name': '|String',
  })

  put_data = {'name': request['name']}
  return firebase.patch('/chatRooms/%s' % request['chatRoomId'], put_data)


def SendChatMessage(request, firebase):
  """Record a chat message.

  Validation:
    Player is in the chat room (via the group).
    The messageId is not used yet in this chat rom.

  Args:
    chatRoomId: Chat room to send the message to.
    messageId: Unique ID to use for the message.
    message: The message to send.

  Firebase entries:
    /chatRooms/%(chatRoomId)/messages
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'chatRoomId': 'ChatRoomId',
    'messageId': '!MessageId',
    'message': 'String',
    'playerId': 'PlayerId'
  })

  chat = request['chatRoomId']
  messageId = request['messageId']
  group = helpers.ChatToGroup(firebase, chat)
  if firebase.get('/chatRooms/%s/messages' % chat, messageId):
    raise InvalidInputError('That message ID was already used.')
  if not firebase.get('/groups/%s/players' % group, request['playerId']):
    raise InvalidInputError('You are not a member of that chat room.')

  # TODO Scan message for any @all or @player to turn into notifications.

  put_data = {
    'playerId': request['playerId'],
    'message': request['message'],
    'time': int(time.time())
  }
  return firebase.put('/chatRooms/%s/messages' % chat, messageId, put_data)


def AckChatMessage(request, firebase):
  """Ack a chat message which sets the ack to the timestamp of that message.

  Validation:
    Player is in the chat room (via the group).

  Args:
    chatRoomId: Chat room to send the message to.
    playerId: Player sending the message.
    messageId: Unique ID to use for the message.

  Firebase entries:
    /chatRooms/%(chatRoomId)/acks
  """
  valid_args = ['chatRoomId', 'playerId']
  required_args = list(valid_args)
  required_args.extend(['messageId'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  messageId = request['messageId']
  playerId = request['playerId']
  group = helpers.ChatToGroup(firebase, chat)
  message = firebase.get('/chatRooms/%s/messages' % chat, messageId)

  if message is None:
    raise InvalidInputError('That message ID is not valid.')
  if not firebase.get('/groups/%s/players' % group, playerId):
    raise InvalidInputError('You are not a member of that chat room.')

  return firebase.put('/chatRooms/%s/acks' % chat, playerId, message['time'])


def AddPlayerToGroup(request, firebase):
  """Add a player to a group.

  Either a member of the group adds another player or an admin adds a player.

  Validation:
    * Player doing the adding is a member of the group AND the group supports adding
      or
      The player is the group owner.
    * otherPlayerId is not already in the group.
    * Both players and the groupId all point to the same game.

  Args:
    groupId: The group to add a player to.
    playerId: The player doing the adding (unless an admin).
    otherPlayerId: The player being added.

  Firebase entries:
    /groups/%(groupId)/players/%(playerId)
    /playersPrivate/%(playerId)/chatRooms/
    /playersPrivate/%(playerId)/missions/
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'groupId': 'GroupId',
    'playerToAddId': 'PlayerId',
  })

  results = []

  game_id = request['gameId']
  requesting_user_id = request['requestingUserId']
  group_id = request['groupId']
  requesting_player_id = request['requestingPlayerId']
  player_to_add_id = request['playerToAddId']

  if helpers.IsAdmin(firebase, game_id, requesting_user_id):
    pass
  elif requesting_player_id is not None:
    pass
  else:
    raise InvalidInputError('Only a player or an admin can call this method!')

  if game_id != helpers.PlayerToGame(firebase, player_to_add_id):
    raise InvalidInputError('Other player is not in the same game as you.')
  if game_id != helpers.GroupToGame(firebase, group_id):
    raise InvalidInputError('That group is not part of your active game.')

  # Validate player_to_add_id is not in the group
  if firebase.get('/groups/%s/players' % group_id, player_to_add_id):
    raise InvalidInputError('Other player is already in the chat.')

  # Player must be the owner or (be in the group and group allows adding).
  print "user id is " + requesting_user_id
  print "Is admin: " + str(helpers.IsAdmin(firebase, game_id, requesting_user_id))
  print "requesting player id %s and owner is %s" % (requesting_player_id, firebase.get('/groups/%s' % group_id, 'ownerPlayerId'))
  if helpers.IsAdmin(firebase, game_id, requesting_user_id):
    pass
  elif requesting_player_id == firebase.get('/groups/%s' % group_id, 'ownerPlayerId'):
    pass
  else:
    print "member? %d" % (not not firebase.get('/groups/%s/players' % group_id, player_to_add_id))
    print "memberscanadd? %d" % (not not firebase.get('/groups/%s' % group_id, 'membersCanAdd'))
    # Validate player_to_add_id is in the chat room.
    if not firebase.get('/groups/%s/players' % group_id, requesting_player_id):
      raise InvalidInputError('You are not a member of that group nor an owner.')
    # Validate players are allowed to add other players.
    if not firebase.get('/groups/%s' % group_id, 'membersCanAdd'):
      raise InvalidInputError('Players are not allowed to add to this group.')
  print "success, adding"
  AddPlayerToGroupInner(firebase, group_id, player_to_add_id)


def AddPlayerToGroupInner(firebase, group_id, player_to_add_id):
  """Add player to a group and mappings for chat rooms, missions, etc.

  When a player is added to a group, find chats and missions associated with
  that group and add those chats and missions to the list of chats and missions
  the player is in.

  Args:
    firebase:
    group_id: Group ID the player was added to.
    player_to_add_id: The player ID in question.

  Firebase entries:
    /groups/%(groupId)/players/
    /playersPrivate/%(playerId)/chatRooms/
    /playersPrivate/%(playerId)/missions/
  """

  firebase.put('/groups/%s/players' % group_id, player_to_add_id, True)

  chats = helpers.GroupToChats(firebase, group_id)
  for chat in chats:
    firebase.put('/playersPrivate/%s/chatRooms' % player_to_add_id, chat, True)

  missions = helpers.GroupToMissions(firebase, group_id)
  for mission in missions:
    firebase.put('/playersPrivate/%s/missions' % player_to_add_id, mission, True)


def RemovePlayerFromGroup(request, firebase):
  """Remove a player from a group.

  Either a member of the group or the admin adds a player.

  Validation:
    * Player doing the removing is a member of the group AND the group supports removing
      or
      The player is the group owner.
    * otherPlayerId is in the group.
    * Both players and the groupId all point to the same game.

  Args:
    groupId: The group to remove a player from.
    playerId: The player doing the removing (unless an admin).
    otherPlayerId: The player being removed.

  Firebase entries:
    /groups/%(groupId)/players/%(playerId)
    /playersPrivate/%(playerId)/chatRooms/
    /playersPrivate/%(playerId)/missions/
  """
  helpers.ValidateInputs(request, firebase, {
    'groupId': 'GroupId',
    'gameId': 'GameId',
    'playerToRemoveId': 'PlayerId'
  })

  requesting_player_id = request['requestingPlayerId']
  requesting_user_id = request['requestingUserId']
  group_id = request['groupId']
  player_to_remove_id = request['playerToRemoveId']
  game_id = request['gameId']

  if helpers.IsAdmin(firebase, game_id, requesting_user_id):
    pass
  elif requesting_player_id is not None:
    pass
  else:
    raise InvalidInputError('Only a player or an admin can call this method!')

  if game_id != helpers.PlayerToGame(firebase, player_to_remove_id):
    raise InvalidInputError('Other player is not in the same game as you.')
  if game_id != helpers.GroupToGame(firebase, group_id):
    raise InvalidInputError('That group is not part of your active game.')

  # Validate otherPlayer is in the group
  if not firebase.get('/groups/%s/players' % group_id, player_to_remove_id):
    raise InvalidInputError('Other player is not in the chat.')

  # Player must be admin or the owner or (be in the group and group allows adding).
  if helpers.IsAdmin(firebase, game_id, requesting_user_id):
    pass
  elif requesting_player_id == firebase.get('/groups/%s' % group_id, 'ownerPlayerId'):
    pass
  else:
    # Validate player is in the chat room.
    if not firebase.get('/groups/%s/players' % group_id, requesting_player_id):
      raise InvalidInputError('You are not a member of that group nor an owner.')
    # Validate players are allowed to remove other players.
    if not firebase.get('/groups/%s' % group_id, 'membersCanRemove'):
      raise InvalidInputError('Players are not allowed to remove from this group.')

  RemovePlayerFromGroupInner(firebase, group_id, player_to_remove_id)


def RemovePlayerFromGroupInner(firebase, group_id, player_id):
  """Remove player from a group and the chat room, mission, etc mappings.

  When a player is removed from a group, find chats and missions associated with
  that group and remove those chats and missions from the list of chats and missions
  the player is in.

  Args:
    firebase:
    group: Group ID the player was added to.
    player: The player ID in question.

  Firebase entries:
    /playersPrivate/%(playerId)/chatRooms/
    /playersPrivate/%(playerId)/missions/
  """

  firebase.delete('/groups/%s/players' % group_id, player_id)

  chats = helpers.GroupToChats(firebase, group_id)
  for chat in chats:
    firebase.delete('/playersPrivate/%s/chatRooms' % player_id, chat)

  missions = helpers.GroupToMissions(firebase, group_id)
  for mission in missions:
    firebase.delete('/playersPrivate/%s/missions' % player_id, mission)


def AutoUpdatePlayerGroups(firebase, player_id, new_player=False):
  """Auto add/remove a player from groups.

  When a player changes allegiances, automatically add/remove them
  from groups.
  If new player, there is no group removal and we need to add to groups without
  an allegiance.

  Args:
    player_id: A player ID
    new_player: This is a new player vs allegiance switch.

  Firebase entries:
    /groups/%(groupId)/players/%(playerId)
    /playersPrivate/%(playerId)/chatRooms/
    /playersPrivate/%(playerId)/missions/
  """
  game = helpers.PlayerToGame(firebase, player_id)
  allegiance = helpers.PlayerAllegiance(firebase, player_id)
  groups = firebase.get('/games/%s' % game, 'groups') or []
  for group_id in groups:
    group = firebase.get('/groups', group_id)
    if group['autoAdd'] and group['allegianceFilter'] == allegiance:
      AddPlayerToGroupInner(firebase, group_id, player_id)
    elif (not new_player and group['autoRemove'] and
          group['allegianceFilter'] != allegiance):
      RemovePlayerFromGroupInner(firebase, group_id, player_id)
    elif new_player and group['autoAdd'] and group['allegianceFilter'] == 'none':
      AddPlayerToGroupInner(firebase, group_id, player_id)


# TODO Decide how to mark a life code as used up.
def Infect(request, firebase):
  """Infect a player via life code.

  Infect a human and gets points.

  Args:
    playerId: The person doing the infecting.
    lifeCode: The life code being taken/infected, makes to the victom.


  Validation:
    Valid IDs. Infector can infect or is self-infecting. Infectee is human.

  Firebase entries:
    /games/%(gameId)/players/%(playerId)
    /groups/%(groupId) indirectly
  """
  helpers.ValidateInputs(request, firebase, {
    'infectionId': '!InfectionId',
    'gameId': 'GameId',
    'infectorPlayerId': 'PlayerId',
    'victimLifeCode': '?String',
    'victimPlayerId': '?PlayerId',
  })

  game_id = request['gameId']
  player_id = request['infectorPlayerId']
  infection_id = request['infectionId']
  victim_life_code = request['victimLifeCode']
  victim_id = helpers.LifeCodeToPlayerId(firebase, game_id, victim_life_code)

  player = {
    'allegiance': firebase.get('/playersPublic/%s' % player_id, 'allegiance'),
    'canInfect': firebase.get('/playersPrivate/%s' % player_id, 'canInfect')
  }
  victim = {
    'allegiance': firebase.get('/playersPublic/%s' % victim_id, 'allegiance'),
    'canInfect': firebase.get('/playersPrivate/%s' % victim_id, 'canInfect')
  }

  # Both players must be in the same game.
  if helpers.PlayerToGame(firebase, victim_id) != game_id:
    raise InvalidInputError('Those players are not part of the same game!')
  # The infector must be able to infect or be doing a self-infect
  if player_id != victim_id and not player['canInfect']:
    raise InvalidInputError('You cannot infect another player at the present time.')
  # The victim must be human to be infected
  if victim['allegiance'] != constants.HUMAN:
    raise InvalidInputError('Your victim is not human and cannot be infected.')

  results = []

  # Add points and an infection entry for a successful infection
  if player_id != victim_id:
    results.append(helpers.AddPoints(firebase, player_id, constants.POINTS_INFECT))
    infect_path = '/playersPublic/%s/infections' % victim_id
    infect_data = {
      'infectorId': player_id,
      'time': int(time.time()),
    }
    results.append(firebase.put(infect_path, infection_id, infect_data))

  # If secret zombie, set the victim to secret zombie and the infector to zombie
  # Else set the victom to zombie
  if player_id != victim_id and player['allegiance'] == constants.HUMAN:
    logging.warn('Secret infection')
    SetPlayerAllegiance(firebase, victim_id, allegiance=constants.HUMAN, can_infect=True)
    SetPlayerAllegiance(firebase, player_id, allegiance=constants.ZOMBIE, can_infect=True)
  else:
    logging.warn('Normal infection')
    SetPlayerAllegiance(firebase, victim_id, allegiance=constants.ZOMBIE, can_infect=True)

  return results


def SetAllegiance(request, firebase):
  """Set the allegiance of a player.

  Used (by admins?) to set a player to human, zombie or secret zombie.
  Shares code with Infect().

  Args:
    playerId: The player to update.
    allegiance: Human or zombie.
    canInfect: If they can infect. With allegiance, gives a secret zombie.

  Validation:
    Zombies must be able to infect.
    TODO Must be admin to call?

  Firebase entries:
    /playersPublic/%(playerId)
    /groups/%(groupId) indirectly
  """
  valid_args = ['playerId', 'allegiance']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  if request['allegiance'] == constants.ZOMBIE and not request['canInfect']:
    raise InvalidInputError('Zombies can always infect.')
  return SetPlayerAllegiance(firebase, request['playerId'], request['allegiance'], request['canInfect'])


def JoinResistance(request, firebase):
  helpers.ValidateInputs(request, firebase, {
    'playerId': 'PlayerId',
    'lifeCode': '?String',
    'lifeId': '?!LifeId',
  })

  player_id = request['playerId']
  life_code = request['lifeCode']

  player = firebase.get('/playersPublic', player_id)
  if player['allegiance'] != 'none':
    raise InvalidInputError('Already have an allegiance!')

  AddLife(request, firebase)

  return SetPlayerAllegiance(firebase, player_id, constants.HUMAN, False)


def JoinHorde(request, firebase):
  helpers.ValidateInputs(request, firebase, {
    'playerId': 'PlayerId',
  })

  player_id = request['playerId']

  player = firebase.get('/playersPublic', player_id)
  if player['allegiance'] != 'none':
    raise InvalidInputError('Already have an allegiance!')
  return SetPlayerAllegiance(firebase, player_id, constants.ZOMBIE, True)


def SetPlayerAllegiance(firebase, player_id, allegiance, can_infect):
  """Helper to set the allegiance of a player.

  Args:
    player_id: The player to update.
    allegiance: Human vs zombie.
    can_infect: Can they infect. Must be true for zombies.

  Validation:
    None.

  Firebase entries:
    /playersPublic/%(playerId)/allegiance
    /playersPrivate/%(playerId)/canInfect
    /groups/%(groupId) indirectly
  """
  game_id = helpers.PlayerToGame(firebase, player_id)
  results = [
    firebase.put('/playersPublic/%s' % player_id, 'allegiance', allegiance),
    firebase.put('/playersPrivate/%s' % player_id, 'canInfect', can_infect),
    AutoUpdatePlayerGroups(firebase, player_id, new_player=False)
  ]
  return results


def AddRewardCategory(request, firebase):
  """Add a new reward group.

  Validation:
    rewardCategoryId is of valid form.

  Args:
    rewardCategoryId: reward type, eg rewardCategory-foo
    gameId: The game ID. eg game-1
    name: Name of the reward, such as "Epic Infection"
    shortName: The shortname for the reward category, will serve as a seed for
        generating the reward codes, and will appear at the front of the
        reward codes. Example "epicinfection"
    limitPerPlayer: (int) how many a player can claim
    points: (int) points the reward is worth

  Firebase entries:
    /rewardCategories/%(rewardCategoryId)
  """
  helpers.ValidateInputs(request, firebase, {
    'rewardCategoryId': '!RewardCategoryId',
    'gameId': 'GameId',
    'name': 'String',
    'shortName': 'String',
    'points': 'Number',
    'limitPerPlayer': 'Number'
  })

  game = request['gameId']
  reward_category_id = request['rewardCategoryId']

  reward_category_data = {
    'gameId': game,
    'claimed': 0,
    'shortName': request['shortName'],
    'name': request['name'],
    'points': int(request['points']),
    'limitPerPlayer': request['limitPerPlayer'],
  }

  firebase.put('/rewardCategories', reward_category_id, reward_category_data)
  firebase.put('/games/%s/rewardCategories' % game, reward_category_id, True)


def UpdateRewardCategory(request, firebase):
  """Update an existing reward group.

  Firebase entries:
    /rewardCategories/%(rewardCategoryId)
  """
  helpers.ValidateInputs(request, firebase, {
    'rewardCategoryId': 'RewardCategoryId',
    'gameId': 'GameId',
    'name': '|String',
    'shortName': '|String',
    'points': '|Number',
    'limitPerPlayer': '|Number'
  })

  reward_category_id = request['rewardCategoryId']

  reward_category_data = {}
  for k in ('name', 'points', 'limitPerPlayer'):
    if k in request:
      reward_category_data[k] = request[k]

  return firebase.patch('/rewardCategories/%s' % reward_category_id, reward_category_data)


def AddReward(request, firebase):
  """Add a new reward to an existing category.

  Validation:

  Args:
    rewardId:
    rewardCategoryId:
    code: The code that the player can use to claim this reward. Must start
        with the reward category's shortName. For example,
        "epicinfection-purple-roller-strike" is a reward for the reward
        category that has shortName "epicinfection".

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """
  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'rewardId': '!RewardId',
    'rewardCategoryId': 'RewardCategoryId',
    'code': '?String'
  })

  game_id = request['gameId']
  reward_id = request['rewardId']
  reward_category_id = request['rewardCategoryId']
  reward_code = request['code'] or '%s-%s' % (reward_category.shortName, RandomWords(3))

  if helpers.RewardCodeToRewardId(firebase, game_id, reward_code, False) is not None:
    raise InvalidInputError('Reward with that code already exists!')

  reward_category =  firebase.get('/rewardCategories/%s' % reward_category_id, None)
  reward_category_short_name = reward_category['shortName']
  if reward_code.split('-')[0] != reward_category_short_name:
    raise InvalidInputError('Reward code must start with category\'s shortName. code: "%s", shortName: "%s"' % (code, reward_category_short_name))

  reward_data = {
    'rewardCategoryId': reward_category_id,
    'code': reward_code,
    'playerId': None,
  }

  return AddRewardToDb(firebase, reward_category_id, reward_id, reward_data)


def AddRewards(request, firebase):
  """Add a set of rewards.

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """

  helpers.ValidateInputs(request, firebase, {
    'gameId': 'GameId',
    'rewardCategoryId': 'RewardCategoryId',
    'count': 'Number'
  })

  reward_category_id = request['rewardCategoryId']

  reward_category =  firebase.get('/rewardCategories/%s' % reward_category_id, None)

  for i in range(request['count']):
    reward_id = 'reward-%s' % random.randint(0, 2**52)
    reward_data = {
      'rewardCategoryId': reward_category_id,
      'code': '%s-%s' % (reward_category.shortName, RandomWords(3)),
      'playerId': None
    }
    AddRewardToDb(firebase, reward_category_id, reward_id, reward)


def AddRewardToDb(firebase, reward_category_id, reward_id, reward):
  """Put a new reward into the DB.

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """
  firebase.put('/rewards', reward_id, reward)
  firebase.put('/rewardCategories/%s/rewards' % reward_category_id, reward_id, True)


def ClaimReward(request, firebase):
  """Claim a reward for a player.

  Validation:
    Reward is valid.
    Reward was not yet claimed.
    This player doesn't have the reward in their claims.

  Args:
    playerId: Player's ID
    gameId: Game ID
    rewardId: reward-foo-bar. Must start with the category

  Firebase entries:
    /playersPublic/%(playerId)/claims/%(rewardId)
    /playersPublic/%(playerId)/points
    /rewards/%(rewardId)/playerId
  """
  helpers.ValidateInputs(request, firebase, {
    'playerId': 'PlayerId',
    'gameId': 'GameId',
    'rewardCode': 'String'
  })

  player = request['playerId']
  game_id = request['gameId']
  reward_code = request['rewardCode']
  game = helpers.PlayerToGame(firebase, player)

  reward_id = helpers.RewardCodeToRewardId(firebase, game_id, reward_code)
  reward = firebase.get('/rewards', reward_id)
  reward_category_id = reward['rewardCategoryId']
  reward_category_path = '/rewardCategories/%s' % reward_category_id

  player_path = '/playersPublic/%s' % player
  reward_path = '/rewards/%s' % reward_id

  reward_category =  firebase.get(reward_category_path, None)

  # Validate the user hasn't already claimed it.
  if firebase.get('%s/claims/%s' % (player_path, reward_id), 'time'):
    raise InvalidInputError('Reward was already claimed by this player.')
  # Validate the reward was not yet claimed by another player.
  already_claimed_by_player_id = firebase.get(reward_path, 'playerId')
  if already_claimed_by_player_id != "" and already_claimed_by_player_id != None:
    raise InvalidInputError('Reward was already claimed.')
  # Check the limitPerPlayer
  if 'limitPerPlayer' in reward_category:
    limit = int(reward_category['limitPerPlayer'])
    claims = firebase.get(player_path, 'claims', {'shallow': True})
    if claims:
      claims = [c for c in claims if c.startswith('reward-%s' % reward_category_seed)]
      if len(claims) >= limit:
        raise InvalidInputError('You have already claimed this reward type %d times, which is the limit.' % limit)

  firebase.patch(reward_path, {'playerId': player})

  reward_points = int(reward_category['points'])
  rewards_claimed = int(reward_category['claimed'])

  helpers.AddPoints(firebase, player, reward_points)
  firebase.patch(reward_category_path, {'claimed': rewards_claimed + 1})
  firebase.patch(reward_path, {'playerId': player})
  claim_data = {'rewardCategoryId': reward_category_id, 'time': int(time.time())}
  firebase.put('%s/claims' % player_path, reward_id, claim_data)




def RandomWords(n):
  words = []
  with open('wordlist.txt') as f:
    wordlist = f.readlines()
    for i in range(n):
      words.append(random.choice(wordlist).strip())
  return '-'.join(words)


def SendNotification(request, firebase):
  """Queue a notification to be sent.

  Validation:
    notificationId does not exist.
    groupId or playerId exists.

  Args:
    notificationId: Queued Notification id to create.
    message: Message to send to client.
    previewMessage: Short preview of the message comments. If empty, one will be generated.
    app: Whether to send as a push notification to the iOS/Android/Web clients.
    vibrate: Whether the notification should vibrate on iOS/Android.
    sound: Whether the notification should play a sound on iOS/Android.
    destination: URL that notification should open when clicked.
    sendTime: When to spawn notifications from this template. UNIX timestamp.
    playerId: Player id to send message to. Cannot be mixed with groupId.
    groupId: Who to send the notifications to. Cannot be mixed with playerId.
    icon: An icon code to show.

  Firebase entries:
    /notifications/%(notificationId)
"""
  valid_args = ['!notificationId']
  if 'groupId' in request and 'playerId' not in request:
    valid_args.append('groupId')
  elif 'playerId' in request and 'groupId' not in request:
    valid_args.append('playerId')
  else:
    raise InvalidInputError('Must include either a playerId or a groupId')

  required_args = list(valid_args)
  required_args.extend(['message', 'app', 'vibrate', 'sound', 'destination',
                        'sendTime', 'groupId', 'icon'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)
  current_time = int(time.time())
  if 'sendTime' in request and current_time > int(request['sendTime']):
    raise InvalidInputError('sendTime must not be in the past!')

  if 'previewMessage' not in request:
    request['previewMessage'] = textwrap.wrap(request['message'], 100)[0]

  put_data = {}
  properties = ['message', 'app', 'vibrate', 'sound', 'destination', 'sendTime',
                'groupId', 'playerId', 'icon', 'previewMessage']

  for property in properties:
    if property in request:
      put_data[property] = request[property]

  return firebase.put('/notifications',
                      request['notificationId'], put_data)


def UpdateNotification(request, firebase):
  """Update a queued notification.

  Validation:
    notificationId exists.

  Args:
    notificationId: Queued Notification id to create.
    message: Message to send to client.
    previewMessage: Short preview of the message conents. Optional.
    app: Whether to send as a push notification to the iOS/Android/Web clients.
    vibrate: Whether the notification should vibrate on iOS/Android.
    sound: Whether the notification should play a sound on iOS/Android.
    destination: URL that notification should open when clicked.
    sendTime: When to spawn notifications from this template. UNIX timestamp.
    playerId: Player id to send message to.
    groupId: Who to send the notifications to.
    icon: An icon code to show.

  Firebase entries:
    /notifications/%(notificationId)
"""
  valid_args = ['notificationId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_data = {}
  properties = ['message', 'app', 'vibrate', 'sound', 'destination', 'sendTime',
                'groupId', 'playerId', 'icon']

  current_time = int(time.time())
  if 'sendTime' in request and current_time > int(request['sendTime']):
    raise InvalidInputError('sendTime must not be in the past!')

  notification = firebase.get('/notifications', request['notificationId'])
  # This shouldn't happen since we validated this above...
  if not notification:
    raise InvalidInputError('notificationId must exist!')
  if current_time > int(notification['sendTime']) or 'sent' in notification:
    raise InvalidInputError('Cannot modify sent notification.')

  for property in properties:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/notifications/%s' % request['notificationId'], put_data)


def MarkNotificationSeen(request, firebase):
  """Updates the notification's seenTime.

  Validation:
    notificationId must exist.
    playerId must exist.

  Args:
    notificationId: Notification Id to update.
    playerId: Player who saw notification.

  Firebase entries:
    /playersPrivate/%(playerId)/notifications/%(notificationId)
"""
  valid_args = ['notificationId', 'playerId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)
  put_data = {
    'time': int(time.time())
  }
  return firebase.patch('/player/%s/notifications/%s' % (
      request['playerId'], request['notificationId']), put_data)


def RegisterUserDevice(request, firebase):
  """Register a user device to a userId.

  Validation:
    userId must exist.

  Args:
    userId: User id to associate with.
    deviceToken: Ionic device token.

  Firebase entries:
    /users/%(userId)/deviceToken
  """
  helpers.ValidateInputs(request, firebase, {
    'userId': 'UserId',
    'deviceToken': 'String',
  })
  put_data = {'deviceToken': request['deviceToken']}
  return firebase.patch('/users/%s', put_data)


def AddLife(request, firebase):
  """Add a new player life.

  Validation:

  Args:
    playerId: The player who gets the new life.

  Firebase entry:
    /playersPublic/%(playerId)/lives
    /lives/%(lifeCode)
  """
  helpers.ValidateInputs(request, firebase, {
    'playerId': 'PlayerId',
    'lifeCode': '?String',
    'lifeId': '?!LifeId'
  })

  player_id = request['playerId']
  game_id = helpers.PlayerToGame(firebase, player_id)
  life_id = request['lifeId'] or 'life-%s' % random.randint(0, 2**52)
  life_code = request['lifeCode'] or RandomWords(3)

  public_life = {
    'time': int(time.time()),
  }

  private_life = {
    'code': life_code,
  }

  results = [
    'Life code: %s' % life_code,
    firebase.put('/playersPublic/%s/lives' % player_id, life_code, public_life),
    firebase.put('/playersPrivate/%s/lives' % player_id, life_code, private_life)
  ]
  return results


def DeleteTestData(request, firebase):
  if request['id'] != secrets.FIREBASE_EMAIL:
    return

  for entry in ROOT_ENTRIES:
    data = firebase.get('/', entry, {'shallow': True})
    if data:
      test_keys = [r for r in data if 'test-' in r]
      for k in test_keys:
        firebase.delete('/%s' % entry, k)


def DumpTestData(request, firebase):
  if request['id'] != secrets.FIREBASE_EMAIL:
    return

  res = {}
  for entry in ROOT_ENTRIES:
    res[entry] = {}
    data = firebase.get('/', entry)
    if data:
      res[entry] = {r: data[r] for r in data if 'test-' in r}
  return res


# vim:ts=2:sw=2:expandtab
