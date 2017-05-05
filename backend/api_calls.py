import time


class InvalidInputError(Exception):
  """Error used when the inputs fail to pass validation."""
  pass


def ValidateInputs(request, firebase, required, valid):
  """Validate args.

  Args:
    required: These args must be present in the request.
    valid: These args must already exist in the DB.

  Raises: InvalidInputError if validation does not pass.
  """
  if any(a not in request for a in required):
    raise InvalidInputError('Missing required input. Required: %s' % ', '.join(required))

  # Any keys fooId must start "foo-XXX"
  for key in request:
    if key.endswith('Id'):
      if not request[key].startswith('%s-' % key[:-2]):
        raise InvalidInputError('Id %s="%s" must start with "%s-".' % (key, request[key], key[:-2]))

  for a in valid:
    data = request[a]
    if a == 'gameId':
      if not firebase.get('/games/%s/name' % data, None):
        raise InvalidInputError('Game %s not found.' % data)
    elif a == 'userToken':
      if not firebase.get('/users/%s' % data, 'registered'):
        raise InvalidInputError('User %s not found.' % data)
    elif a in ('playerId', 'otherPlayerId'):
      if not firebase.get('/games/%s/players/%s/name' % (request['gameId'], data), None):
        raise InvalidInputError('Player %s not found.' % data)
    elif a == 'gunId':
      if not firebase.get('/guns', data):
        raise InvalidInputError('Gun %s not found.' % data)
    elif a == 'missionId':
      if not firebase.get('/missions/%s/name' % data, None):
        raise InvalidInputError('Mission %s not found.' % data)
    elif a == 'chatRoomId':
      if not firebase.get('/chatRooms/%s/name' % data, None):
        raise InvalidInputError('Chat room %s not found.' % data)
    elif a == 'rewardCategoryId':
      if not firebase.get('/games/%s/rewardCategories/%s/name' % (request['gameId'], data), None):
        raise InvalidInputError('Reward category %s not found.' % data)
    elif a == 'rewardId':
      path = '/games/%s/rewardCategories/%s/rewards/%s' % (request['gameId'], request['rewardCategoryId'], data)
      if not firebase.get(path, None):
        raise InvalidInputError('Reward %s not found.' % data)
    elif a == 'allegianceFilter':
      if data not in constants.ALLEGIANCES:
        raise InvalidInputError('Allegiance %s is not valid.' % data)
    else:
      raise AppError('Unhandled arg validation: %s' % a)


def Register(request, firebase):
  """Register a new user in the DB.

  Validation:
  Args:
    userToken: Unique user token added to the user list.

  Firebase entries:
    /users/%(userToken)
  """
  valid_args = []
  required_args = ['userToken']
  ValidateInputs(request, firebase, required_args, valid_args)

  user_token = request['userToken']
  put_data = {'registered': True}
  return firebase.put('/users', user_token, put_data)


def CreateGame(request, firebase):
  """Create a new game.

  Validation:
    gameId must be valid format.

  Args:
    gameId:
    userToken:
    name:
    rulesHtml:
    stunTimer:

  Firebase entries:
    /games/%(gameId)
  """
  valid_args = []
  required_args = ['gameId', 'userToken', 'name', 'rulesHtml', 'stunTimer']
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']

  put_data = {
    'name': request['name'],
    'rulesHtml': request['rulesHtml'],
    'stunTimer': request['stunTimer'],
    'active': True,
    'adminUserId': request['adminUserId'],
  }
  return firebase.put('/games', game, put_data)


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

  game = request['gameId']

  put_data = {}
  for property in ['name', 'rulesHtml', 'stunTimer']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/games/%s' % game, put_data)


def CreatePlayer(request, firebase):
  """Create a new player for a user and put that player into the game.

  Player data gets sharded between /games/%(gameId)/players/%(playerId)
  and /players/%(playerId) for public and private info about players.
  The latter can be used to map a playerId to a gameId.

  Validation:
  Args:
    gameId:
    userToken:
    playerId:
    name:
    needGun:
    profileImageUrl:
    startAsZombie:
    volunteer:
    beSecretZombie:

  Firebase entries:
    /players/%(playerId)
    /users/%(userToken)/players/%(playerId)
    /games/%(gameId)/players/%(playerId)
  """
  valid_args = ['gameId', 'userToken']
  required_args = list(valid_args)
  required_args.extend(['playerId', 'name', 'needGun', 'profileImageUrl'])
  required_args.extend(['startAsZombie', 'volunteer', 'beSecretZombie'])
  ValidateInputs(request, firebase, required_args, valid_args)

  # TODO Validate:
  # Unique playerId, correct format

  result = []

  game = request['gameId']
  player = request['playerId']
  user_token = request['userToken']
  name = request['name']
  need_gun = request['needGun']
  profile_image_url = request['profileImageUrl']
  start_as_zombie = request['startAsZombie']
  volunteer = request['volunteer']
  be_secret_zombie = request['beSecretZombie']

  player_info = {'gameId': game}
  result.append(firebase.put('/users/%s/players' % user_token, player, player_info))

  player_info = {
    'gameId': game,
    'userId': user_token,
    'canInfect': start_as_zombie,
    'needGun' : need_gun,
    'startAsZombie' : start_as_zombie,
    'volunteer' : volunteer,
    'wantsToBeSecretZombie': be_secret_zombie,
  }
  result.append(firebase.put('/players', player, player_info))

  if start_as_zombie:
    allegiance = 'horde'
  else:
    allegiance = 'resistence'

  game_info = {
    'user_id' : user_token,
    'name': name,
    'profileImageUrl' : profile_image_url,
    'points': 0,
    'allegiance': allegiance,
  }
  result.append(firebase.put('/games/%s/players' % game, player, game_info))

  return result


def AddGun(request, firebase):
  """Add a new gun to the DB.

  Validation:
  Args:
    gunId: The ID of the gun.

  Firebase entries:
    /guns/%(gunId)/
  """
  valid_args = []
  required_args = ['gunId']
  ValidateInputs(request, firebase, required_args, valid_args)

  gun = request['gunId']

  put_data = {'playerId': ''}
  return firebase.put('/guns', gun, put_data)


def AssignGun(request, firebase):
  """Assign a gun to a given player.

  Validation:
    Gun must exist.
    Player must exist.

  Args:
    gameId:
    playerId:
    gunId:

  Firebase entries:
    /guns/%(gunId)
  """
  valid_args = ['gameId', 'playerId', 'gunId']
  required_args = list(valid_args)
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  gun = request['gunId']
  player = request['playerId']

  put_data = {
    'playerId': player,
    'gameId': game,
  }
  return firebase.put('/guns', gun, put_data)


def UpdatePlayer(request, firebase):
  """Update player properties.

  Validation:
  Args:
    gameId:
    playerId:

  Firebase entries:
    /games/%(gameId)/players/%(playerId)
  """
  valid_args = ['gameId', 'playerId']
  required_args = list(valid_args)
  ValidateInputs(request, firebase, required_args, valid_args)

  player = request['playerId']
  game = request['gameId']

  put_data = {}
  for property in ['name', 'needGun', 'profileImageUrl', 'startAsZombie', 'volunteer']:
    if property in request:
      put_data[property] = request[property]

  path = '/games/%s/players/%s' % (game, player)
  return firebase.patch(path, put_data)


def AddMission(request, firebase):
  """Add a new mission.

  Validation:
  Args:
  Firebase entries:
    /missions/%(missionId)
  """
  valid_args = ['allegiance']
  required_args = list(valid_args)
  required_args.extend(['missionId', 'name', 'begin', 'end', 'detailsHtml'])
  ValidateInputs(request, firebase, required_args, valid_args)

  mission = request['missionId']

  put_data = {
    'name': request['name'],
    'begin': request['begin'],
    'end': request['end'],
    'detailsHtml': request['detailsHtml'],
    'allegiance': request['allegiance'],
  }

  return firebase.put('/missions', mission, put_data)


def UpdateMission(request, firebase):
  """Update details of a mission.

  Validation:
  Args:
    missionId
    name (optional):
    begin (optional):
    end (optional):
    detailsHtml (optional):
    allegiance (optional):

  Firebase entries:
    /missions/%(missionId)
  """
  valid_args = ['missionId']
  required_args = list(valid_args)
  ValidateInputs(request, firebase, required_args, valid_args)

  mission = request['missionId']

  put_data = {}
  for property in ['name', 'begin', 'end', 'detailsHtml', 'allegiance']:
    if property in request:
      put_data[property] = request[property]

  return firebase.patch('/missions/%s' % mission, put_data)


def CreateChatRoom(request, firebase):
  """Create a new chat room.

  Use the chatId to make a new chat room.
  Add the player to the room and set the other room properties.
  Add the chatRoomId to the game's list of chat rooms.

  Validation:
  Args:
  Firebase entries:
    /chatRooms/%(chatRoomId)
    /chatRooms/%(chatRoomId)/memberships
    /games/%(gameId)/chatRoomIds
  """
  valid_args = ['gameId', 'playerId', 'allegianceFilter']
  required_args = list(valid_args)
  required_args.extend(['chatRoomId', 'name'])
  ValidateInputs(request, firebase, required_args, valid_args)

  chat = request['chatRoomId']
  game = request['gameId']
  player = request['playerId']
  name = request['name']
  allegiance = request['allegianceFilter']
  
  # Validate chatRoomId is of the form chatRoom-NNN and not used yet
  if firebase.get('/chatRooms/%s' % chat, 'name'):
    raise InvalidInputError('Chat ID is already in use.')

  put_data = {
    'allegianceFilter': allegiance,
    'gameId': game,
    'name': name,
  }
  result = []
  result.append(firebase.put('/chatRooms', chat, put_data))
  result.append(firebase.put('/chatRooms/%s/memberships' % chat, player, ""))
  result.append(firebase.put('/games/%s/chatRoomIds' % game, chat, ""))
  return result


def AddPlayerToChat(request, firebase):
  """Add a new player to a chat room.

  Validation:
    Player doing the adding is a member of the room.

  Args:
    gameId: The game ID.
    chatRoomId: The chat room ID to add the player to.
    otherPlayerId: The player being added.
    playerId: The player doing the adding.

  Firebase entries:
    /chatRooms/%(chatRoomId)/memberships/%(playerId)
  """
  valid_args = ['gameId', 'chatRoomId', 'playerId', 'otherPlayerId']
  required_args = list(valid_args)
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  chat = request['chatRoomId']
  player = request['playerId']
  otherPlayer = request['otherPlayerId']

  # Validate player is in the chat room
  if firebase.get('/chatRooms/%s/memberships/%s' % (chat, player), None) is None:
    raise InvalidInputError('You are not a member of that chat room.')
  # Validate otherPlayer is not in the chat room
  if firebase.get('/chatRooms/%s/memberships' % chat, otherPlayer) is not None:
    raise InvalidInputError('Other player is already in the chat.')
  # TODO Check allegiance?

  return firebase.put('/chatRooms/%s/memberships' % chat, otherPlayer, "")


def SendChatMessage(request, firebase):
  """Send a message to a chat room.

  Validation:
    Player is a member of the chat room.

  Args:
    gameId: The game ID.
    chatRoomId: The chat room to update.
    playerId: The player sending the message.
    messageId: The ID of the new message.
    message: The message to add (string).

  Firebase entries:
    /chatRooms/%(chatRoomId)/memberships/%(playerId)
    /chatRooms/%(chatRoomId)/messages
  """
  valid_args = ['gameId', 'chatRoomId', 'playerId']
  required_args = list(valid_args)
  required_args.extend(['messageId', 'message'])
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  chat = request['chatRoomId']
  player = request['playerId']
  messageId = request['messageId']
  message = request['message']

  # Validate player is in the chat room
  if firebase.get('/chatRooms/%s/memberships/%s' % (chat, player), None) is None:
    raise InvalidInputError('You are not a member of that chat room.')

  # Compute the message index to use -- reimplement auto IDs ;)
  index = 1

  message_data = {
    'index': index,
    'message': message,
    'playerId': player,
    'time': int(time.time()),
  }

  return firebase.put('/chatRooms/%s/messages' % chat, messageId, message_data)


def AddRewardCategory(request, firebase):
  """Add a new reward group.

  Validation:
    rewardCatergoryId is of valid form.

  Args:
    gameId: The game ID. eg game-1
    rewardCatergoryId: reward type, eg rewardCategory-foo
    name: Name of the reward
    points: (int) points the reward is worth

  Firebase entries:
    /games/%(gameId)/rewardCategories/%(rewardCatergoryId)
  """
  valid_args = ['gameId']
  required_args = list(valid_args)
  required_args.extend(['name', 'points', 'rewardCategoryId'])
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  name = request['name']
  points = int(request['points'])
  reward_category = request['rewardCategoryId']

  reward_category_data = {
    'claimed': 0,
    'name': name,
    'points': points,
  }

  return firebase.put('/games/%s/rewardCategories' % game, reward_category, reward_category_data)


def UpdateRewardCategory(request, firebase):
  """Update an existing reward group.

  Validation:
    rewardCatergoryId exists.

  Args:
    gameId: The game ID. eg game-1
    rewardCatergoryId: reward type, eg rewardCategory-foo
    name: Name of the reward
    points: (int) points the reward is worth

  Firebase entries:
    /games/%(gameId)/rewardCategories/%(rewardCatergoryId)
  """
  valid_args = ['gameId', 'rewardCategoryId']
  required_args = list(valid_args)
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  reward_category = request['rewardCategoryId']

  reward_category_data = {}
  for k in ('name', 'points'):
    if k in request:
      reward_category_data[k] = request[k]

  return firebase.patch('/games/%s/rewardCategories/%s' % (game, reward_category), reward_category_data)


def AddReward(request, firebase):
  """Add a new reward to an existing category.

  Validation:
    rewardCategoryId is valid.
    rewardId is a valid format.

  Args:
    gameId: The game ID.
    rewardCatergoryId: reward type, eg rewardCategory-foo
    rewardId: reward-foo-bar. Must start with the category

  Firebase entries:
    /games/%(gameId)/rewardCategories/%(rCId)/rewards/%(rewardId)
  """
  valid_args = ['gameId', 'rewardCategoryId']
  required_args = list(valid_args)
  required_args.extend(['rewardId'])
  ValidateInputs(request, firebase, required_args, valid_args)

  game = request['gameId']
  reward_category = request['rewardCategoryId']
  reward = request['rewardId']
  reward_seed = reward_category[len('rewardCategory-'):]

  reward_data = {'playerId': ''}

  path = '/games/%s/rewardCategories/%s/rewards' % (game, reward_category)
  return firebase.put(path, reward, reward_data)


def ClaimReward(request, firebase):
  """Claim a reward for a player.

  Validation:
    Reward is valid.
    Reward was not yet claimed.
    This player doesn't have the reward in their claims.

  Args:
    gameId: The game ID.
    playerId: Player's ID
    rewardId: reward-foo-bar. Must start with the category

  Firebase entries:
    /games/%(gameId)/players/%(playerId)/claims/%(rewardId)
    /games/%(gameId)/players/%(playerId)/points
    /games/%(gameId)/rewardCategories/%(rCId)
    /games/%(gameId)/rewardCategories/%(rCId)/rewards/%(rewardId)
    /games/%(gameId)/rewardCategories/%(rCId)/rewards/%(rewardId)/playerId
  """
  valid_args = ['gameId', 'playerId']
  required_args = list(valid_args)
  required_args.extend(['rewardId'])
  ValidateInputs(request, firebase, required_args, valid_args)

  result = []

  game = request['gameId']
  player = request['playerId']
  reward = request['rewardId']

  reward_category_seed = reward.split('-')[1]
  reward_category = 'rewardCategory-%s' % reward_category_seed

  player_path = '/games/%s/players/%s' % (game, player)
  reward_category_path = '/games/%s/rewardCategories/%s' % (game, reward_category)
  reward_path = '%s/rewards/%s' % (reward_category_path, reward)

  if not firebase.get(reward_path, None):
    raise InvalidInputError('Reward %s not found.' % reward)

  # Validate the user hasn't already claimed it.
  if firebase.get('%s/claims/%s' % (player_path, reward), 'time'):
    raise InvalidInputError('Reward was already claimed by this player.')
  # Validate the reward was not yet claimed by another player.
  if firebase.get(reward_path, 'playerId') != "":
    raise InvalidInputError('Reward was already claimed.')

  result.append(firebase.patch(reward_path, {'playerId': player}))

  current_points = int(firebase.get(player_path, 'points'))
  reward_points = int(firebase.get(reward_category_path, 'points'))
  new_player_points = current_points + reward_points

  rewards_claimed = int(firebase.get(reward_category_path, 'claimed'))

  result.append('Player points = %d + %d => %d' % (current_points, reward_points, new_player_points))
  result.append('Claim count %d => %d' % (rewards_claimed, rewards_claimed + 1))
  result.append(firebase.patch(reward_category_path, {'claimed': rewards_claimed + 1}))
  result.append(firebase.patch(player_path, {'points': new_player_points}))
  result.append(firebase.patch(reward_path, {'playerId': player}))
  claim_data = {'rewardCategoryId': reward_category, 'time': int(time.time())}
  result.append(firebase.put('%s/claims' % player_path, reward, claim_data))

  return result


# vim:ts=2:sw=2:expandtab
