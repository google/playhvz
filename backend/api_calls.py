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
    'chatRooms', 'games', 'groups', 'guns', 'missions', 'players',
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
  valid_args = ['!userId']
  required_args = list(valid_args)
  required_args.extend(['name'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  data = {'name': request['name']}
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
  valid_args = ['!gameId', 'adminUserId']
  required_args = list(valid_args)
  required_args.extend(['name', 'rulesHtml', 'stunTimer'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_data = {
    'name': request['name'],
    'rulesHtml': request['rulesHtml'],
    'stunTimer': request['stunTimer'],
    'active': True,
  }
  results.append(firebase.put('/games', request['gameId'], put_data))
  results.append(firebase.put('/games/%s/adminUsers' % request['gameId'], request['adminUserId'], True))
  return results


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
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

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

  valid_args = ['gameId', 'userId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

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
  results = []
  valid_args = ['!groupId', 'gameId', 'ownerPlayerId', 'allegianceFilter']
  required_args = ['name', 'groupId', 'gameId', 'allegianceFilter']
  required_args.extend(['autoAdd', 'autoRemove', 'membersCanAdd', 'membersCanRemove'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_args = set(required_args + ['ownerPlayerId']) - set(['groupId'])
  group_data = {k: request[k] for k in put_args if k in request}

  results.append(firebase.put('/groups', request['groupId'], group_data))
  results.append(firebase.put('/games/%s/groups/' % request['gameId'], request['groupId'], True))
  if 'ownerPlayerId' in request:
    results.append(firebase.put('/groups/%s/players' % request['groupId'], request['ownerPlayerId'], True))

  # TODO We may need to populate a group automatically on creation.

  return results


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
  valid_args = ['groupId', 'ownerPlayerId']
  required_args = list(['groupId'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_data = {}
  for property in ['name', 'autoAdd', 'autoRemove', 'membersCanAdd', 'membersCanRemove', 'ownerPlayerId']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/groups/%s' % request['groupId'], put_data)


def AddPlayer(request, firebase):
  """Add a new player for a user and put that player into the game.

  Player data gets sharded between /games/%(gameId)/players/%(playerId)
  and /players/%(playerId) for public and private info about players.
  The latter can be used to map a playerId to a gameId.

  Validation:
  Args:
    gameId: ID of the game this player is for.
    userId: ID of this user.
    playerId: ID to use.
    name: Player's name.
    needGun: Needs a gun for the game.
    profileImageUrl: URL of an image to use for the profile.
    gotEquipment: Is borrowing GHvZ equipment.
    startAsZombie:
    beSecretZombie:
    notifySound:
    notifyVibrate:
    helpAdvertising:
    helpLogistics:
    helpCommunications
    helpModerator
    helpCleric
    helpSorcerer
    helpAdmin
    helpPhotographer
    helpChronicler
    helpServer
    helpClient
    helpMobile

  Firebase entries:
    /players/%(playerId)
    /users/%(userId)/players/%(playerId)
    /games/%(gameId)/players/%(playerId)
  """
  valid_args = ['gameId', 'userId', '!playerId']
  required_args = list(valid_args)
  required_args.extend(['name', 'needGun', 'profileImageUrl'])
  required_args.extend(['startAsZombie', 'beSecretZombie'])
  required_args.extend(['notifySound', 'notifyVibrate'])
  required_args.extend(['gotEquipment'])
  required_args.extend(list(constants.PLAYER_VOLUNTEER_ARGS))
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  results = []

  game = request['gameId']
  player = request['playerId']
  user = request['userId']

  player_info = {'gameId': game}
  results.append(firebase.put('/users/%s/players' % user, player, player_info))

  player_info = {
    'gameId': game,
    'userId': user,
    'canInfect': (request['startAsZombie'] or request['beSecretZombie']),
    'needGun' : request['needGun'],
    'gotEquipment' : request['gotEquipment'],
    'startAsZombie' : request['startAsZombie'],
    'wantsToBeSecretZombie': request['beSecretZombie'],
  }
  results.append(firebase.put('/players', player, player_info))

  settings = {
    'sound': request['notifySound'],
    'vibrate': request['notifyVibrate'],
  }
  results.append(firebase.put('/players/%s' % player, 'notificationSettings', settings))

  volunteer = {v[4].lower() + v[5:]: request[v] for v in constants.PLAYER_VOLUNTEER_ARGS}
  results.append(firebase.put('/players/%s' % player, 'volunteer', volunteer))

  if request['startAsZombie']:
    allegiance = 'horde'
  else:
    allegiance = 'resistance'

  game_info = {
    'number': random.randint(0, 99) + 100 * len(firebase.get('/players', None, {'shallow': True})),
    'userId' : user,
    'name': request['name'],
    'profileImageUrl' : request['profileImageUrl'],
    'active': True,
    'points': 0,
    'allegiance': allegiance,
  }
  results.append(firebase.put('/games/%s/players' % game, player, game_info))

  AutoUpdatePlayerGroups(firebase, player, new_player=True)

  return results


def UpdatePlayer(request, firebase):
  """Update player properties.

  Validation:
  Args:
    playerId:
    name (optional):
    needGun (optional):
    profileImageUrl (optional):
    startAsZombie (optional):
    notifySound:
    notifyVibrate:
    helpAdvertising:
    helpLogistics:
    helpCommunications
    helpModerator
    helpCleric
    helpSorcerer
    helpAdmin
    helpPhotographer
    helpChronicler
    helpServer
    helpClient
    helpMobile

  Firebase entries:
    /players/%(playerId)
    /games/%(gameId)/players/%(playerId)
  """
  results = []
  valid_args = ['playerId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  player = request['playerId']
  game = helpers.PlayerToGame(firebase, player)

  player_info = {}
  for property in ['startAsZombie', 'needGun', 'wantsToBeSecretZombie']:
    if property in request:
      player_info[property] = request[property]

  settings = {}
  for property in ['notifySound', 'notifyVibrate']:
    if property in request:
      settings[property] = request[property]

  volunteer = {}
  for property in constants.PLAYER_VOLUNTEER_ARGS:
    if property in request:
      volunteer[property[4].lower() + property[5:]] = request[property]

  game_info = {}
  for property in ['name', 'profileImageUrl']:
    if property in request:
      game_info[property] = request[property]

  if player_info:
    results.append(firebase.patch('/players/%s' % player, player_info))
  if settings:
    results.append(firebase.patch('/players/%s/notificationSettings' % player, settings))
  if volunteer:
    results.append(firebase.patch('/players/%s/volunteer' % player, volunteer))
  if game_info:
    results.append(firebase.patch('/games/%s/players/%s' % (game, player), game_info))

  return results


def AddGun(request, firebase):
  """Add a new gun to the DB.

  Validation:
  Args:
    gunId: The ID of the gun.

  Firebase entries:
    /guns/%(gunId)/
  """
  valid_args = ['!gunId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  return firebase.put('/guns', request['gunId'], {'playerId': '', 'a': True})


def AssignGun(request, firebase):
  """Assign a gun to a given player.

  Validation:
    Gun must exist.
    User must exist.

  Args:
    playerId:
    gunId:

  Firebase entries:
    /guns/%(gunId)
  """
  valid_args = ['playerId', 'gunId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)
  return firebase.put('/guns/%s' % request['gunId'], 'playerId', request['playerId'])


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
  valid_args = ['!missionId', 'groupId']
  required_args = list(valid_args)
  required_args.extend(['name', 'begin', 'end', 'detailsHtml'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  mission_data = {k: request[k] for k in required_args if k[0] != '!'}

  game = helpers.GroupToGame(firebase, request['groupId'])

  results = []
  results.append(firebase.put('/missions', request['missionId'], mission_data))
  results.append(firebase.put('/games/%s/missions' % game, request['missionId'], True))
  return results


def UpdateMission(request, firebase):
  """Update details of a mission.

  Validation:
  Args:
    missionId
    name (optional):
    groupId:
    begin (optional):
    end (optional):
    detailsHtml (optional):

  Firebase entries:
    /missions/%(missionId)
  """
  valid_args = ['missionId', 'groupId']
  required_args = list(['missionId'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  mission = request['missionId']

  put_data = {}
  for property in ['name', 'begin', 'end', 'detailsHtml', 'groupId']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/missions/%s' % mission, put_data)


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
  valid_args = ['!chatRoomId', 'groupId']
  required_args = list(valid_args)
  required_args.extend(['name', 'withAdmins'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  game = helpers.GroupToGame(firebase, request['groupId'])

  put_data = {k: request[k] for k in ('groupId', 'name', 'withAdmins')}
  results = []
  results.append(firebase.put('/chatRooms', chat, put_data))
  results.append(firebase.put('/games/%s/chatRooms' % game, chat, True))
  return results


def UpdateChatRoom(request, firebase):
  """Update a chat room.

  Validation:

  Args:
    chatRoomId: Chat room ID
    name: Chat room name (optional)

  Firebase entries:
    /chatRooms/%(chatRoomId)
  """
  valid_args = ['chatRoomId']
  required_args = list(valid_args)
  required_args.extend(['name'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  put_data = {'name': request['name']}
  return firebase.patch('/chatRooms/%s' % request['chatRoomId'], put_data)


def SendChatMessage(request, firebase):
  """Record a chat message.

  Validation:
    Player is in the chat room (via the group).
    The messageId is not used yet in this chat rom.

  Args:
    chatRoomId: Chat room to send the message to.
    playerId: Player sending the message.
    messageId: Unique ID to use for the message.
    message: The message to send.

  Firebase entries:
    /chatRooms/%(chatRoomId)/messages
  """
  valid_args = ['chatRoomId', 'playerId']
  required_args = list(valid_args)
  required_args.extend(['messageId', 'message'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

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
    /players/%(playerId)/chatRooms/
    /players/%(playerId)/missions/
  """
  valid_args = ['groupId', 'playerId', 'otherPlayerId']
  required_args = ['groupId', 'otherPlayerId']
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  if 'playerId' not in request:
    raise InvalidInputError('playerId is required unless you are an admin (not supported yet).')
  elif not helpers.EntityExists(firebase, 'playerId', request['playerId']):
    raise InvalidInputError('PlayerID %s does not exist.' % request['playerId'])

  results = []

  group = request['groupId']
  player = request['playerId']
  otherPlayer = request['otherPlayerId']
  game = helpers.PlayerToGame(firebase, player)

  if game != helpers.PlayerToGame(firebase, otherPlayer):
    raise InvalidInputError('Other player is not in the same game as you.')
  if game != helpers.GroupToGame(firebase, group):
    raise InvalidInputError('That group is not part of your active game.')

  # Validate otherPlayer is not in the group
  if firebase.get('/groups/%s/players' % group, otherPlayer):
    raise InvalidInputError('Other player is already in the chat.')

  # Player must be the owner or (be in the group and group allows adding).
  if player == firebase.get('/groups/%s' % group, 'ownerPlayerId'):
    pass
  else:
    # Validate player is in the chat room.
    if not firebase.get('/groups/%s/players' % group, player):
      raise InvalidInputError('You are not a member of that group nor an owner.')
    # Validate players are allowed to add other players.
    if not firebase.get('/groups/%s' % group, 'membersCanAdd'):
      raise InvalidInputError('Players are not allowed to add to this group.')

  results.append(firebase.put('/groups/%s/players' % group, otherPlayer, True))
  results.append(AddPlayerGroupMappings(firebase, group, otherPlayer))
  return results


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
    /players/%(playerId)/chatRooms/
    /players/%(playerId)/missions/
  """
  valid_args = ['groupId', 'playerId', 'otherPlayerId']
  required_args = ['groupId', 'otherPlayerId']
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  if 'playerId' not in request:
    raise InvalidInputError('playerId is required unless you are an admin (not supported yet).')
  elif not helpers.EntityExists(firebase, 'playerId', request['playerId']):
    raise InvalidInputError('PlayerID %s does not exist.' % request['playerId'])

  results = []

  group = request['groupId']
  player = request['playerId']
  otherPlayer = request['otherPlayerId']
  game = helpers.PlayerToGame(firebase, player)

  if game != helpers.PlayerToGame(firebase, otherPlayer):
    raise InvalidInputError('Other player is not in the same game as you.')
  if game != helpers.GroupToGame(firebase, group):
    raise InvalidInputError('That group is not part of your active game.')

  # Validate otherPlayer is in the group
  if not firebase.get('/groups/%s/players' % group, otherPlayer):
    raise InvalidInputError('Other player is not in the chat.')

  # Player must be the owner or (be in the group and group allows adding).
  if player == firebase.get('/groups/%s' % group, 'ownerPlayerId'):
    pass
  else:
    # Validate player is in the chat room.
    if not firebase.get('/groups/%s/players' % group, player):
      raise InvalidInputError('You are not a member of that group nor an owner.')
    # Validate players are allowed to remove other players.
    if not firebase.get('/groups/%s' % group, 'membersCanRemove'):
      raise InvalidInputError('Players are not allowed to remove from this group.')

  results.append(firebase.delete('/groups/%s/players' % group, otherPlayer))
  results.append(RemovePlayerGroupMappings(firebase, group, otherPlayer))
  return results


def AddPlayerGroupMappings(firebase, group, player):
  """Add mappings when a player is added to a group.

  When a player is added to a group, find chats and missions associated with
  that group and add those chats and missions to the list of chats and missions
  the player is in.

  Args:
    firebase:
    group: Group ID the player was added to.
    player: The player ID in question.

  Firebase entries:
    /players/%(playerId)/chatRooms/
    /players/%(playerId)/missions/
  """
  chats = helpers.GroupToChats(firebase, group)
  for chat in chats:
    firebase.put('/players/%s/chatRooms' % player, chat, True)

  missions = helpers.GroupToMissions(firebase, group)
  for mission in missions:
    firebase.put('/players/%s/missions' % player, mission, True)

  return [
      'Added player %s to %d chats: %r' % (player, len(chats), chats),
      'Added player %s to %d missions: %r' % (player, len(missions), missions)]


def RemovePlayerGroupMappings(firebase, group, player):
  """Remive mappings when a player is removed from a group.

  When a player is removed from a group, find chats and missions associated with
  that group and remove those chats and missions from the list of chats and missions
  the player is in.

  Args:
    firebase:
    group: Group ID the player was added to.
    player: The player ID in question.

  Firebase entries:
    /players/%(playerId)/chatRooms/
    /players/%(playerId)/missions/
  """
  chats = helpers.GroupToChats(firebase, group)
  for chat in chats:
    firebase.delete('/players/%s/chatRooms' % player, chat)

  missions = helpers.GroupToMissions(firebase, group)
  for mission in missions:
    firebase.delete('/players/%s/missions' % player, mission)

  return [
      'Removed player %s from %d chats.' % (player, len(chats)),
      'Removed player %s from %d missions.' % (player, len(missions))]


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
    /players/%(playerId)/chatRooms/
    /players/%(playerId)/missions/
  """
  game = helpers.PlayerToGame(firebase, player_id)
  allegiance = helpers.PlayerAllegiance(firebase, player_id)
  groups = firebase.get('/games/%s' % game, 'groups') or []
  for group_id in groups:
    group = firebase.get('/groups', group_id)
    if group['autoAdd'] and group['allegianceFilter'] == allegiance:
      firebase.put('/groups/%s/players' % group_id, player_id, True)
      AddPlayerGroupMappings(firebase, group_id, player_id)
    elif (not new_player and group['autoRemove'] and
          group['allegianceFilter'] != allegiance):
      firebase.delete('/groups/%s/players' % group_id, player_id)
      RemovePlayerGroupMappings(firebase, group_id, player_id)
    elif new_player and group['autoAdd'] and group['allegianceFilter'] == 'none':
      firebase.put('/groups/%s/players' % group_id, player_id, True)
      AddPlayerGroupMappings(firebase, group_id, player_id)


# TODO Decide how to mark a life code as used up.
def Infect(request, firebase):
  """Infect a player via life code.

  Infect a human and gets points.

  Args:
    playerId: The person doing the infecting.
    lifeCodeId: The life code being taken/infected, makes to the victom.


  Validation:
    Valid IDs. Infector can infect or is self-infecting. Infectee is human.

  Firebase entries:
    /games/%(gameId)/players/%(playerId)
    /groups/%(groupId) indirectly
  """
  valid_args = ['playerId', 'lifeCodeId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  player_id = request['playerId']
  life_code_id = request['lifeCodeId']
  victim_id = helpers.LifeCodeToPlayer(firebase, request['lifeCodeId'])
  game_id = helpers.PlayerToGame(firebase, player_id)

  player = {
    'allegiance': firebase.get('/games/%s/players/%s' % (game_id, player_id), 'allegiance'),
    'can_infect': firebase.get('/players/%s' % player_id, 'canInfect')
  }
  victim = {
    'allegiance': firebase.get('/games/%s/players/%s' % (game_id, victim_id), 'allegiance'),
    'can_infect': firebase.get('/players/%s' % victim_id, 'canInfect')
  }

  # Both players must be in the same game.
  if helpers.PlayerToGame(firebase, victim_id) != game_id:
    raise InvalidInputError('Those players are not part of the same game!')
  # The infector must be able to infect or be doing a self-infect
  if player_id != victim_id and not player['can_infect']:
    raise InvalidInputError('You cannot infect another player at the present time.')
  # The victim must be human to be infected
  if victim['allegiance'] != constants.HUMAN:
    raise InvalidInputError('Your victim is not human and cannot be infected.')

  results = []

  # Add points and an infection entry for a successful infection
  if player_id != victim_id:
    results.append(helpers.AddPoints(firebase, player_id, constants.POINTS_INFECT))
    infect_path = '/games/%s/players/%s/infections' % (game_id, victim_id)
    infect_data = {
      'infectorId': player_id,
      'lifeCodeId': life_code_id,
      'time': int(time.time()),
    }
    results.append(firebase.put(infect_path, request['lifeCodeId'], infect_data))

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
    /games/%(gameId)/players/%(playerId)
    /groups/%(groupId) indirectly
  """
  valid_args = ['playerId', 'allegiance']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  if request['allegiance'] == constants.ZOMBIE and not request['canInfect']:
    raise InvalidInputError('Zombies can always infect.')
  return SetPlayerAllegiance(firebase, request['playerId'], request['allegiance'], request['canInfect'])


def SetPlayerAllegiance(firebase, player_id, allegiance, can_infect):
  """Helper to set the allegiance of a player.

  Args:
    player_id: The player to update.
    allegiance: Human vs zombie.
    can_infect: Can they infect. Must be true for zombies.

  Validation:
    None.

  Firebase entries:
    /games/%(gameId)/players/%(playerId)/allegiance
    /players/%(playerId)/canInfect
    /groups/%(groupId) indirectly
  """
  game_id = helpers.PlayerToGame(firebase, player_id)
  results = [
    firebase.put('/games/%s/players/%s' % (game_id, player_id), 'allegiance', allegiance),
    firebase.put('/players/%s' % player_id, 'canInfect', can_infect),
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
    name: Name of the reward
    limitPerPlayer: (int) how many a player can claim
    points: (int) points the reward is worth

  Firebase entries:
    /rewardCategories/%(rewardCategoryId)
  """
  results = []
  valid_args = ['!rewardCategoryId', 'gameId']
  required_args = list(valid_args)
  required_args.extend(['name', 'points', 'limitPerPlayer'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  reward_category = request['rewardCategoryId']

  reward_category_data = {
    'gameId': game,
    'claimed': 0,
    'name': request['name'],
    'points': int(request['points']),
    'limitPerPlayer': request['limitPerPlayer'],
  }

  results.append(firebase.put('/rewardCategories', reward_category, reward_category_data))
  results.append(firebase.put('/games/%s/rewardCategories' % game, reward_category, True))
  return results


def UpdateRewardCategory(request, firebase):
  """Update an existing reward group.

  Validation:
    rewardCategoryId exists.

  Args:
    rewardCategoryId: reward type, eg rewardCategory-foo
    name: Name of the reward
    limitPerPlayer: (int) how many a player can claim
    points: (int) points the reward is worth

  Firebase entries:
    /rewardCategories/%(rewardCategoryId)
  """
  valid_args = ['rewardCategoryId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  reward_category = request['rewardCategoryId']

  reward_category_data = {}
  for k in ('name', 'points', 'limitPerPlayer'):
    if k in request:
      reward_category_data[k] = request[k]

  return firebase.patch('/rewardCategories/%s' % reward_category, reward_category_data)


def AddReward(request, firebase):
  """Add a new reward to an existing category.

  Validation:

  Args:
    rewardId: reward-foo-bar. Must start with the category, ie foo

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """
  valid_args = ['!rewardId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  reward = request['rewardId']
  reward_category = 'rewardCategory-%s' % reward.split('-')[1]

  # Validation the rewardCategory
  if not helpers.EntityExists(firebase, 'rewardCategoryId', reward_category):
    raise InvalidInputError('Reward seed %s matches no category.' % reward)

  return AddRewardToDb(firebase, reward)


def AddRewards(request, firebase):
  """Add a set of rewards.

  Validation:

  Args:
    rewardCategoryId:
    count: How many rewards to generate.

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """
  results = []

  valid_args = ['rewardCategoryId']
  required_args = list(valid_args)
  required_args.extend(['count'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  reward_category = request['rewardCategoryId']
  reward_seed = reward_category.split('-')[1]
  reward_data = {'playerId': '', 'a': True}

  for i in range(request['count']):
    reward = 'reward-%s-%s' % (reward_seed, RandomWords(3))
    results.append(AddRewardToDb(firebase, reward))

  return results


def AddRewardToDb(firebase, reward):
  """Put a new reward into the DB.

  Firebase entries:
    /rewards/%(rewardId)
    /rewardCategories/%(rcID)/rewards/%(rewardId)
  """
  firebase.put('/rewards', reward, {'playerId': '', 'a': True})
  reward_category = 'rewardCategory-%s' % reward.split('-')[1]
  firebase.put('/rewardCategories/%s/rewards' % reward_category, reward, True)
  return 'Added reward %s (category %s)' % (reward, reward_category)


def ClaimReward(request, firebase):
  """Claim a reward for a player.

  Validation:
    Reward is valid.
    Reward was not yet claimed.
    This player doesn't have the reward in their claims.

  Args:
    playerId: Player's ID
    rewardId: reward-foo-bar. Must start with the category

  Firebase entries:
    /games/%(gameId)/players/%(playerId)/claims/%(rewardId)
    /games/%(gameId)/players/%(playerId)/points
    /rewards/%(rewardId)/playerId
  """
  valid_args = ['playerId', 'rewardId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  results = []

  player = request['playerId']
  reward_id = request['rewardId']
  game = helpers.PlayerToGame(firebase, player)

  reward_category_seed = reward_id.split('-')[1]
  reward_category = 'rewardCategory-%s' % reward_category_seed

  player_path = '/games/%s/players/%s' % (game, player)
  reward_category_path = '/rewardCategories/%s' % reward_category
  reward_path = '/rewards/%s' % reward_id

  reward_category =  firebase.get(reward_category_path, None)

  # Validate the user hasn't already claimed it.
  if firebase.get('%s/claims/%s' % (player_path, reward_id), 'time'):
    raise InvalidInputError('Reward was already claimed by this player.')
  # Validate the reward was not yet claimed by another player.
  if firebase.get(reward_path, 'playerId') != "":
    raise InvalidInputError('Reward was already claimed.')
  # Check the limitPerPlayer
  if 'limitPerPlayer' in reward_category:
    limit = int(reward_category['limitPerPlayer'])
    claims = firebase.get(player_path, 'claims', {'shallow': True})
    if claims:
      claims = [c for c in claims if c.startswith('reward-%s' % reward_category_seed)]
      if len(claims) >= limit:
        raise InvalidInputError('You have already claimed this reward type %d times, which is the limit.' % limit)

  results.append(firebase.patch(reward_path, {'playerId': player}))

  reward_points = int(reward_category['points'])
  rewards_claimed = int(reward_category['claimed'])

  results.append(helpers.AddPoints(firebase, player, reward_points))
  results.append('Claim count %d => %d' % (rewards_claimed, rewards_claimed + 1))
  results.append(firebase.patch(reward_category_path, {'claimed': rewards_claimed + 1}))
  results.append(firebase.patch(reward_path, {'playerId': player}))
  claim_data = {'rewardCategoryId': reward_category, 'time': int(time.time())}
  results.append(firebase.put('%s/claims' % player_path, reward_id, claim_data))

  return results




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
    /players/%(playerId)/notifications/%(notificationId)
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
  valid_args = ['userId']
  required_args = list(valid_args)
  required_args.extend(['deviceToken'])
  helpers.ValidateInputs(request, firebase, required_args, valid_args)
  put_data = {'deviceToken': request['deviceToken']}
  return firebase.patch('/users/%s', put_data)


def AddLife(request, firebase):
  """Add a new player life.

  Validation:

  Args:
    playerId: The player who gets the new life.

  Firebase entry:
    /game/%(gameId)/players/%(playerId)/lives
    /lives/%(lifeCode)
  """
  valid_args = ['playerId']
  required_args = list(valid_args)
  helpers.ValidateInputs(request, firebase, required_args, valid_args)

  player_id = request['playerId']
  game_id = helpers.PlayerToGame(firebase, player_id)
  life_code_id = 'lifeCode-%s' % RandomWords(3)

  results = [
    'Life code: %s' % life_code_id,
    firebase.put('/games/%s/players/%s/lives' % (game_id, player_id), life_code_id, True),
    firebase.put('/lives', life_code_id, player_id)
  ]
  return results


def DeleteTestData(request, firebase):
  if request['id'] != secrets.FIREBASE_EMAIL:
    return

  for entry in ROOT_ENTRIES:
    data = firebase.get('/', entry, {'shallow': True})
    if data:
      test_keys = [r for r in data if 'test_' in r]
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
      res[entry] = {r: data[r] for r in data if 'test_' in r}
  return res


# vim:ts=2:sw=2:expandtab
