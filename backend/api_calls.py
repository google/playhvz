import logging
import random
import time
import textwrap

import constants
import secrets


class InvalidInputError(Exception):
  """Error used when the inputs fail to pass validation."""
  pass


# ID entity types
ENTITY_TYPES = (
    'chatRoomId', 'gameId', 'groupId', 'gunId', 'messageId',
    'missionId', 'playerId', 'rewardCategoryId', 'rewardId', 'userId',
    'notificationId')

# Map all expected args to an entity type
KEY_TO_ENTITY = {a: a for a in ENTITY_TYPES}
KEY_TO_ENTITY.update({
  'adminUserId': 'userId', 'otherPlayerId': 'playerId',
  'ownerPlayerId': 'playerId'
})

# Used for trawling the full DB.
ROOT_ENTRIES = (
    'chatRooms', 'games', 'groups', 'guns', 'missions', 'players',
    'users', 'rewardCategories', 'rewards', 'notifications')

# Mapping from a key name to where in Firebase it can be found
# along with a specific value that can be used to validate existance.
ENTITY_PATH = {
  'gameId': ['/games/%s', 'name'],
  'userId': ['/users/%s', 'name'],
  'groupId': ['/groups/%s', 'gameId'],
  'playerId': ['/players/%s', 'userId'],
  'gunId': ['/guns/%s', 'a'],
  'missionId': ['/missions/%s', 'name'],
  'chatRoomId': ['/chatRooms/%s', 'name'],
  'rewardCategoryId': ['/rewardCategories/%s', 'name'],
  'rewardId': ['/rewards/%s', 'a'],
  'notificationId': ['/notifications/%s', None],
}


def EntityExists(firebase, key, value):
  path, item = ENTITY_PATH[KEY_TO_ENTITY[key]]
  return (firebase.get(path % value, item) is not None)


def ValidateInputs(request, firebase, required, valid):
  """Validate args.

  Keys in valid starting with a '!' are testing to ensure they do *not* exist.
  Any request item ending with Id eg 'fooId' must have a value starting 'foo-'

  Args:
    required: These args must be present in the request.
    valid: These args must already exist in the DB.

  Raises: InvalidInputError if validation does not pass.
  """
  if request is None:
    request = {}

  r_keys = set()
  for key in required:
    if key[0] == '!':
      key = key[1:]
    r_keys.add(key)
  supplied = set(request.keys())

  if r_keys - supplied:
    raise InvalidInputError('Missing required input.\n Missing: %s.\n Required: %s' % (
        ', '.join(r_keys - supplied), ', '.join(required)))

  # Any keys fooId must start "foo-XXX"
  for key in request:
    if key.endswith('Id'):
      if key in KEY_TO_ENTITY:
        entity = KEY_TO_ENTITY[key]
        if not request[key].startswith('%s-' % entity[:-2]):
          raise InvalidInputError('Id %s="%s" must start with "%s-".' % (
              key, request[key], entity[:-2]))
      else:
        raise InvalidInputError('Key %s looks like an undefined entity.' % key)


  for key in valid:
    negate = False
    if key[0] == '!':
      negate = True
      key = key[1:]
    if key not in request:
      continue
    data = request[key]

    if key in KEY_TO_ENTITY and KEY_TO_ENTITY[key] in ENTITY_PATH:
      exists = EntityExists(firebase, key, data)
      if negate and exists:
        raise InvalidInputError('%s %s must not exist but was found.' % (key, data))
      elif not negate and not exists:
        raise InvalidInputError('%s %s is not valid.' % (key, data))
    elif key in ('allegiance', 'allegianceFilter'):
      if data not in constants.ALLEGIANCES:
        raise InvalidInputError('Allegiance %s is not valid.' % data)
    else:
      raise InvalidInputError('Unhandled arg validation: "%s"' % key)


def GroupToGame(firebase, group):
  """Map a group to a game."""
  return firebase.get('/groups/%s' % group, 'gameId')


def PlayerToGame(firebase, player):
  """Map a player to a game."""
  return firebase.get('/players/%s' % player, 'gameId')


def ChatToGroup(firebase, chat):
  """Map a chat to a group."""
  return firebase.get('/chatRooms/%s' % chat, 'groupId')


def ChatToGame(firebase, chat):
  """Map a chat to a group."""
  group = ChatToGroup(firebase, chat)
  if group is None:
    return None
  return GroupToGame(group)


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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
    allegiance = 'resistence'

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
  ValidateInputs(request, firebase, required_args, valid_args)

  player = request['playerId']
  game = PlayerToGame(firebase, player)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)
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
  ValidateInputs(request, firebase, required_args, valid_args)

  mission_data = {k: request[k] for k in required_args if k[0] != '!'}

  game = GroupToGame(firebase, request['groupId'])

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  game = GroupToGame(firebase, request['groupId'])

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  messageId = request['messageId']
  group = ChatToGroup(firebase, chat)
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
  ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  messageId = request['messageId']
  playerId = request['playerId']
  group = ChatToGroup(firebase, chat)
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
    * Player doing the adding is a member of the group AND the group suppoers adding
      or
      The player is the group owner.
    * otherPlayerId is not already in the group.
    * Both players and the groupId all point to the same game. TODO

  Args:
    groupId: The group to add a player to.
    playerId: The player doing the adding (unless an admin).
    otherPlayerId: The player being added.

  Firebase entries:
    /groups/%(groupId)/players/%(playerId)
  """
  valid_args = ['groupId', 'playerId', 'otherPlayerId']
  required_args = ['groupId', 'otherPlayerId']
  ValidateInputs(request, firebase, required_args, valid_args)

  if 'playerId' not in request:
    raise InvalidInputError('playerId is required unless you are an admin (not supported yet).')
  elif not firebase.get('/players/%s' % request['playerId'], 'userId'):
    raise InvalidInputError('PlayerID %s does not exist.' % request['playerId'])

  results = []

  group = request['groupId']
  player = request['playerId']
  otherPlayer = request['otherPlayerId']
  game = PlayerToGame(firebase, player)

  if game != PlayerToGame(firebase, otherPlayer):
    raise InvalidInputError('Other player is not in the same game as you.')
  if game != GroupToGame(firebase, group):
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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)

  reward = request['rewardId']
  reward_category = 'rewardCategory-%s' % reward.split('-')[1]

  # Validation the rewardCategory
  if not EntityExists(firebase, 'rewardCategoryId', reward_category):
    raise InvalidInputError('Reward seed %s matches no category.' % reward)

  results = []
  reward_data = {'playerId': '', 'a': True}
  results.append(firebase.put('/rewards', reward, reward_data))
  results.append(firebase.put('/rewardCategories/%s/rewards' % reward_category, reward, True))
  return results


def AddRewards(request, firebase):
  """Add a set of rewards.

  Validation:

  Args:
    rewardCategoryId:
    count: How many rewards to generate.

  Firebase entries:
    /rewards/%(rewardId)
  """
  results = []

  valid_args = ['rewardCategoryId']
  required_args = list(valid_args)
  required_args.extend(['count'])
  ValidateInputs(request, firebase, required_args, valid_args)

  reward_category = request['rewardCategoryId']
  reward_seed = reward_category.split('-')[1]
  reward_data = {'playerId': '', 'a': True}

  for i in range(request['count']):
    reward = 'reward-%s-%s' % (reward_seed, RandomWords(3))
    results.append({reward: firebase.put('/rewards', reward, reward_data)})

  return results


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
  ValidateInputs(request, firebase, required_args, valid_args)

  results = []

  player = request['playerId']
  reward = request['rewardId']
  game = PlayerToGame(firebase, player)

  reward_category_seed = reward.split('-')[1]
  reward_category = 'rewardCategory-%s' % reward_category_seed

  player_path = '/games/%s/players/%s' % (game, player)
  reward_category_path = '/rewardCategories/%s' % reward_category
  reward_path = '/rewards/%s' % reward

  # Validate the user hasn't already claimed it.
  if firebase.get('%s/claims/%s' % (player_path, reward), 'time'):
    raise InvalidInputError('Reward was already claimed by this player.')
  # Validate the reward was not yet claimed by another player.
  if firebase.get(reward_path, 'playerId') != "":
    raise InvalidInputError('Reward was already claimed.')
  # Check the limitPerPlayer
  reward_limit = int(firebase.get(reward_category_path, 'limitPerPlayer'))
  if reward_limit:
    claims = firebase.get(player_path, 'claims', {'shallow': True})
    if claims:
      claims = [c for c in claims if c.startswith('reward-%s' % reward_category_seed)]
      if len(claims) >= reward_limit:
        raise InvalidInputError('You have already claimed this reward type %d times, which is the limit.' % reward_limit)

  results.append(firebase.patch(reward_path, {'playerId': player}))

  current_points = int(firebase.get(player_path, 'points'))
  reward_points = int(firebase.get(reward_category_path, 'points'))
  new_player_points = current_points + reward_points

  rewards_claimed = int(firebase.get(reward_category_path, 'claimed'))

  results.append('Player points = %d + %d => %d' % (current_points, reward_points, new_player_points))
  results.append('Claim count %d => %d' % (rewards_claimed, rewards_claimed + 1))
  results.append(firebase.patch(reward_category_path, {'claimed': rewards_claimed + 1}))
  results.append(firebase.patch(player_path, {'points': new_player_points}))
  results.append(firebase.patch(reward_path, {'playerId': player}))
  claim_data = {'rewardCategoryId': reward_category, 'time': int(time.time())}
  results.append(firebase.put('%s/claims' % player_path, reward, claim_data))

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
  ValidateInputs(request, firebase, required_args, valid_args)
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
  ValidateInputs(request, firebase, required_args, valid_args)

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
  ValidateInputs(request, firebase, required_args, valid_args)
  put_data = {
    'time': int(time.time())
  }
  return firebase.patch('/player/%s/notifications/%s' % (
      request['playerId'], request['notificationId']), put_data)


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
