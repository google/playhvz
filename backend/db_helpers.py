"""DB helper methods."""

import constants

class InvalidInputError(Exception):
  """Error used when the inputs fail to pass validation."""
  pass

class ServerError(Exception):
  pass


def ExpectExistence(firebase, path, id, test_property, should_exist):
  exists = firebase.get(path, test_property) is not None
  print 'Couldnt find at path %s test prop %s' % (path, test_property)
  if exists and not should_exist:
    raise InvalidInputError('ID "%s" should not have existed!' % id)
  if not exists and should_exist:
    raise InvalidInputError('ID "%s" should have existed!' % id)


def ValidateInputs(request, firebase, params):
  """Validate args.

  params is a map of parameter name to an "expectation".
  Examples:
    addGun might have { 'gunId': '!GunId', 'label': 'String' }
    updateGun might have { 'gunId': 'GunId' 'playerId': '|?PlayerId' }

  Expectations ending with 'Id' mean this ID should exist.
  Expectations starting with a '!' mean this ID shouldn't exist.
  Expectations starting with a '?' are nullable.
  Expectations starting with a '|' don't need to be present (useful for update calls).

  Raises: InvalidInputError if validation does not pass.
  """

  if request is None:
    request = {}

  params['requestingUserToken'] = 'String'
  params['requestingUserId'] = '?UserId'
  params['requestingPlayerId'] = '?PlayerId'

  ValidateInputsInner(request, firebase, params)

def ValidateInputsInner(request, firebase, params):
  for key in request:
    if key not in params:
      raise InvalidInputError('Unrecognized argument: "%s"' % key)

  for key, expectation in params.iteritems():
    if isinstance(expectation, dict):
      if key not in request:
        request[key] = {}
      if not isinstance(request[key], dict):
        raise InvalidInputError('Expected map for argument "%s"' % key)
      ValidateInputsInner(request[key], firebase, params[key])
      continue

    if key not in request:
      if expectation[0] == '|':
        continue
      else:
        raise InvalidInputError('Missing argument: "%s"' % key)
    if expectation[0] == '|':
      expectation = expectation[1:]

    data = request[key]

    if expectation[0] == '?':
      expectation = expectation[1:]
      if data is None:
        continue

    if expectation == "Number":
      if str(int(data)) != str(data):
        raise InvalidInputError('Argument "%s" is "%s" but should have been a number!' % (key, data))
    elif expectation == "Timestamp":
      if str(int(data)) != str(data) or data < 1420000000000 or data > 2210000000000:
        raise InvalidInputError('Argument "%s" is "%s" but should have been a timestamp in milliseconds!' % (key, data))
    elif expectation == "String":
      if not isinstance(data, basestring):
        raise InvalidInputError('Argument "%s" is "%s" but should have been a string!' % (key, data))
    elif expectation == "Boolean":
      if str(not not data) != str(data):
        raise InvalidInputError('Argument "%s" is "%s" but should have been a boolean!' % (key, data))
    else:
      should_exist = True
      if expectation[0] == '!':
        should_exist = False
        expectation = expectation[1:]

      if expectation == "GameId":
        ExpectExistence(firebase, '/games/%s' % data, data, 'name', should_exist)
      if expectation == "UserId":
        ExpectExistence(firebase, '/users/%s' % data, data, 'a', should_exist)
      if expectation == "GroupId":
        ExpectExistence(firebase, '/groups/%s' % data, data, 'gameId', should_exist)
      if expectation == "PlayerId":
        ExpectExistence(firebase, '/playersPrivate/%s' % data, data, 'gameId', should_exist)
      if expectation == "GunId":
        ExpectExistence(firebase, '/guns/%s' % data, data, 'label', should_exist)
      if expectation == "MissionId":
        ExpectExistence(firebase, '/missions/%s' % data, data, 'gameId', should_exist)
      if expectation == "ChatRoomId":
        ExpectExistence(firebase, '/chatRooms/%s' % data, data, 'gameId', should_exist)
      if expectation == "RewardCategoryId":
        ExpectExistence(firebase, '/rewardCategories/%s' % data, data, 'gameId', should_exist)
      if expectation == "RewardId":
        pass
      if expectation == "NotificationCategoryId":
        ExpectExistence(firebase, '/notificationCategories/%s' % data, data, 'gameId', should_exist)
      

def GroupToGame(firebase, group):
  """Map a group to a game."""
  return firebase.get('/groups/%s' % group, 'gameId')


def RewardCodeToRewardCategoryId(firebase, game_id, reward_code, expect=True):
  reward_category_short_name = reward_code.split('-')[0]
  reward_categories = firebase.get(
      '/',
      'rewardCategories',
      {'orderBy': '"gameId"', 'equalTo': '"%s"' % game_id})
  if reward_categories is not None:
    for reward_category_id, reward_category in reward_categories.iteritems():
      if reward_category['shortName'] == reward_category_short_name:
        return reward_category_id
  if expect:
    raise InvalidInputError('No reward category for shortName %s' % reward_category_short_name)
  return None


def RewardCodeToRewardId(firebase, game_id, reward_code, expect=True):
  reward_category_id = RewardCodeToRewardCategoryId(firebase, game_id, reward_code, expect)
  if reward_category_id is None:
    return None
  rewards = firebase.get(
      '/',
      'rewards',
      {'orderBy': '"rewardCategoryId"', 'equalTo': '"%s"' % reward_category_id})
  if rewards is not None:
    for reward_id, reward in rewards.iteritems():
      if reward['code'] == reward_code:
        return reward_id
  if expect:
    raise InvalidInputError('No reward for code %s' % reward_code)
  return None

def GetNextPlayerNumber(firebase, game_id):
  players = firebase.get(
      '/',
      'playersPrivate',
      {'orderBy': '"gameId"', 'equalTo': '"%s"' % game_id})
  return 101 + len(players)

def LifeCodeToPlayerId(firebase, game_id, life_code, expect=True):
  player_short_name = life_code.split('-')[0]
  players = firebase.get(
      '/',
      'playersPrivate',
      {'orderBy': '"gameId"', 'equalTo': '"%s"' % game_id})
  if players is not None:
    for player_id, player in players.iteritems():
      if 'lives' in player:
        for life_id, life in player['lives'].iteritems():
          if life['code'] == life_code:
            return player_id
  if expect:
    raise InvalidInputError('No player for life code %s' % life_code)
  return None


def IsAdmin(firebase, game_id, user_id):
  if user_id is None:
    return False
  return firebase.get('/games/%s/adminUsers' % game_id, user_id) is not None

def GroupToEntity(firebase, group, entity):
  rooms = firebase.get(
      '/', entity, {'orderBy': '"groupId"', 'equalTo': '"%s"' % group})
  if rooms:
    return rooms.keys()
  return []


def GroupToMissions(firebase, group):
  return GroupToEntity(firebase, group, 'missions')


def GroupToChats(firebase, group):
  return GroupToEntity(firebase, group, 'chatRooms')


def PlayerToGame(firebase, player):
  """Map a player to a game."""
  return firebase.get('/playersPrivate/%s' % player, 'gameId')


def PlayerAllegiance(firebase, player):
  """Map a player to an allegiance."""
  return firebase.get('playersPublic/%s' % player, 'allegiance')


def ChatToGroup(firebase, chat):
  """Map a chat to a group."""
  return firebase.get('/chatRooms/%s' % chat, 'groupId')


def ChatToGame(firebase, chat):
  """Map a chat to a group."""
  group = ChatToGroup(firebase, chat)
  if group is None:
    return None
  return GroupToGame(group)


def AddPoints(firebase, player_id, points):
  """Add points to a player."""
  player_path = '/playersPublic/%s' % player_id
  current_points = int(firebase.get(player_path, 'points'))
  new_points = current_points + points
  firebase.put(player_path, 'points', new_points)
  return 'Player points = %d + %d => %d' % (current_points, points, new_points)



# vim:ts=2:sw=2:expandtab
