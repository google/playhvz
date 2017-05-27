"""DB helper methods."""

import constants

# ID entity types
ENTITY_TYPES = (
    'chatRoomId', 'gameId', 'groupId', 'gunId', 'messageId',
    'missionId', 'playerId', 'rewardCategoryId', 'rewardId', 'userId',
    'notificationId', 'lifeCodeId')

# Map all expected args to an entity type
KEY_TO_ENTITY = {a: a for a in ENTITY_TYPES}
KEY_TO_ENTITY.update({
  'adminUserId': 'userId', 'otherPlayerId': 'playerId',
  'ownerPlayerId': 'playerId'
})


# Mapping from a key name to where in Firebase it can be found
# along with a specific value that can be used to validate existance.
ENTITY_PATH = {
  'gameId': ['/games/%s', 'name'],
  'userId': ['/users/%s', 'name'],
  'groupId': ['/groups/%s', 'gameId'],
  'playerId': ['/playersPrivate/%s', 'userId'],
  'gunId': ['/guns/%s', 'a'],
  'missionId': ['/missions/%s', 'name'],
  'chatRoomId': ['/chatRooms/%s', 'name'],
  'rewardCategoryId': ['/rewardCategories/%s', 'name'],
  'rewardId': ['/rewards/%s', 'code'],
  'notificationId': ['/notifications/%s', None],
  'lifeCodeId': ['/lives/%s', None],
}


class InvalidInputError(Exception):
  """Error used when the inputs fail to pass validation."""
  pass


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


def RewardCodeToRewardCategoryId(firebase, game_id, reward_code, expect=True):
  reward_category_short_name = reward_code.split('-')[0]
  print "lizard1 " + reward_category_short_name
  print {'orderBy': '"gameId"', 'equalTo': '"%s"' % game_id}
  reward_categories = firebase.get(
      '/',
      'rewardCategories',
      {'orderBy': '"gameId"', 'equalTo': '"%s"' % game_id})
  print "lizard2"
  print reward_categories
  if reward_categories is not None:
    print "lizard3"
    for reward_category_id, reward_category in reward_categories.iteritems():
      print "lizard4"
      print reward_category_id
      print reward_category
      if reward_category['shortName'] == reward_category_short_name:
        return reward_category_id
  if expect:
    raise InvalidInputError('No reward category for shortName %s' % reward_category_short_name)
    print "lizardnone"
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


def LifeCodeToPlayer(firebase, life_code):
  """Map a life code to a player."""
  return firebase.get('/lives', life_code)


def AddPoints(firebase, player_id, points):
  """Add points to a player."""
  player_path = '/playersPublic/%s' % player_id
  current_points = int(firebase.get(player_path, 'points'))
  new_points = current_points + points
  firebase.put(player_path, 'points', new_points)
  return 'Player points = %d + %d => %d' % (current_points, points, new_points)



# vim:ts=2:sw=2:expandtab
