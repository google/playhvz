#!/usr/bin/python
#
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""TODO: High-level file comment."""

import sys
import time
import copy
import constants
import textwrap


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
"""DB helper methods."""



class Optional:
  def __init__(self, expectation):
    self.expectation = expectation

class InvalidInputError(Exception):
  """Error used when the inputs fail to pass validation."""
  pass

class ServerError(Exception):
  pass


def ExpectExistence(game_state, path, id, test_property, should_exist):
  exists = game_state.get(path, test_property) is not None
  if exists and not should_exist:
    raise InvalidInputError('ID "%s" should not have existed!' % id)
  if not exists and should_exist:
    print "game_state:", str(game_state.transaction.local_patch.data_tree)
    raise InvalidInputError('ID "%s" should have existed!' % id)


def ValidateInputs(request, game_state, expectations_by_param_name):
  """Validate args.

  expectations_by_param_name is a map of parameter name to an "expectation".
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

  expectations_by_param_name['requestingUserIdJwt'] = '?String'
  expectations_by_param_name['requestingUserId'] = '?UserId'
  expectations_by_param_name['requestingPlayerId'] = '?PublicPlayerId'
  expectations_by_param_name['requestTimeOffset'] = '|Number'


  try:
    ValidateInputsInner(request, game_state, expectations_by_param_name)
  except:
    print "Error while validating:", sys.exc_info()[0]
    print "Expectations:"
    print expectations_by_param_name
    print "Request:"
    print request
    raise

def ValidateInputsInner(request, game_state, expectations_by_param_name):
  for param_name in request.keys():
    if param_name not in expectations_by_param_name:
      raise InvalidInputError('Unrecognized argument: "%s"' % param_name)

  for param_name, expectation in expectations_by_param_name.iteritems():
    if isinstance(expectation, Optional):
      if param_name not in request:
        continue
      # An Optional is just a wrapper with a property called 'expectation'
      # Now that we know the user did supply it, just pretend that we're
      # checking against that expectation property
      expectation = expectation.expectation

    if isinstance(expectation, dict):
      if param_name not in request:
        request[param_name] = {}
      if not isinstance(request[param_name], dict):
        raise InvalidInputError('Expected map for argument "%s"' % param_name)
      ValidateInputsInner(request[param_name], game_state, expectation)
      continue

    # At this point, expectation should be a string
    if not isinstance(expectation, str):
      raise ServerError('Unknown type for expectation')

    if param_name not in request:
      if expectation[0] == '|':
        continue
      else:
        raise InvalidInputError('Missing argument: "%s"' % param_name)
    if expectation[0] == '|':
      expectation = expectation[1:]

    data = request[param_name]

    if expectation[0] == '?':
      expectation = expectation[1:]
      if data is None:
        continue

    if expectation == "Number":
      if type(data) != float and type(data) != int:
        raise InvalidInputError('Argument "%s" is "%s" but should have been a number!' % (param_name, data))
    elif expectation == "Timestamp":
      if str(int(data)) != str(data) or data < 1420000000000 or data > 2210000000000:
        raise InvalidInputError('Argument "%s" is "%s" but should have been a timestamp in milliseconds!' % (param_name, data))
    elif expectation == "String":
      if not isinstance(data, basestring):
        raise InvalidInputError('Argument "%s" is "%s" but should have been a string!' % (param_name, data))
    elif expectation == "Boolean":
      if str(not not data) != str(data):
        raise InvalidInputError('Argument "%s" is "%s" but should have been a boolean!' % (param_name, data))
    else:
      should_exist = True
      if expectation[0] == '!':
        should_exist = False
        expectation = expectation[1:]

      if expectation == "GameId":
        ExpectExistence(game_state, '/games/%s' % data, data, 'name', should_exist)
      elif expectation == "UserId":
        ExpectExistence(game_state, '/users/%s' % data, data, 'a', should_exist)
      elif expectation == "GroupId":
        ExpectExistence(game_state, '/groups/%s' % data, data, 'gameId', should_exist)
      elif expectation == "PublicPlayerId":
        ExpectExistence(game_state, '/publicPlayers/%s' % data, data, 'gameId', should_exist)
      elif expectation == "PrivatePlayerId":
        ExpectExistence(game_state, '/privatePlayers/%s' % data, data, 'gameId', should_exist)
      elif expectation == "PublicLifeId":
        ExpectExistence(game_state, '/publicLives/%s' % data, data, 'gameId', should_exist)
      elif expectation == "PrivateLifeId":
        ExpectExistence(game_state, '/privateLives/%s' % data, data, 'gameId', should_exist)
      elif expectation == "GunId":
        ExpectExistence(game_state, '/guns/%s' % data, data, 'label', should_exist)
      elif expectation == "MissionId":
        ExpectExistence(game_state, '/missions/%s' % data, data, 'gameId', should_exist)
      elif expectation == "ChatRoomId":
        ExpectExistence(game_state, '/chatRooms/%s' % data, data, 'gameId', should_exist)
      elif expectation == "RewardCategoryId":
        ExpectExistence(game_state, '/rewardCategories/%s' % data, data, 'gameId', should_exist)
      # TODO: Do a deep search to find these IDs to check that they exist or not
      elif expectation == "RewardId":
        pass
      elif expectation == "MessageId":
        pass
      elif expectation == "RequestCategoryId":
        pass
      elif expectation == "InfectionId":
        pass
      elif expectation == "QuizQuestionId":
        pass
      elif expectation == "RequestId":
        pass
      elif expectation == "QuizAnswerId":
        pass
      elif expectation == "MarkerId":
        pass
      elif expectation == "NotificationId":
        pass
      elif expectation == "QueuedNotificationId":
        ExpectExistence(game_state, '/queuedNotifications/%s' % data, data, 'gameId', should_exist)
      elif expectation == "MapId":
        ExpectExistence(game_state, '/maps/%s' % data, data, 'accessGroupId', should_exist)
      else:
        raise ServerError('Unknown expectation for %s: %s' % (param_name, expectation))

def GroupToGame(game_state, group):
  """Map a group to a game."""
  return game_state.get('/groups/%s' % group, 'gameId')


def RewardCodeToRewardCategoryId(game_state, game_id, reward_code, expect=True):
  parts = reward_code.split('-')
  reward_category_short_name = "-".join(parts[0:(len(parts)-2)])
  reward_categories = GetValueWithPropertyEqualTo(
      game_state,
      'rewardCategories',
      'gameId',
      game_id)
  if reward_categories is not None:
    for reward_category_id, reward_category in reward_categories.iteritems():
      if reward_category['shortName'] == reward_category_short_name:
        return reward_category_id
  if expect:
    raise InvalidInputError('No reward with that code exists! %s' % reward_code)
  return None


def RewardCodeToRewardId(game_state, game_id, reward_code, expect=True):
  reward_category_id = RewardCodeToRewardCategoryId(game_state, game_id, reward_code, expect)
  if reward_category_id is None:
    return None
  rewards = GetValueWithPropertyEqualTo(
      game_state,
      'rewards',
      'rewardCategoryId',
      reward_category_id)
  if rewards is not None:
    for reward_id, reward in rewards.iteritems():
      if reward['code'] == reward_code:
        return reward_id
  if expect:
    raise InvalidInputError('No reward with that code exists! %s' % reward_code)
  return None

def GetNextPlayerNumber(game_state, game_id):
  players = GetValueWithPropertyEqualTo(
      game_state,
      'privatePlayers',
      'gameId',
      game_id)
  return 101 + len(players)

def GetPrivatePlayerId(game_state, public_player_id):
  return game_state.get('/publicPlayers/%s' % public_player_id, 'privatePlayerId')


def GetIdSuffix(id):
  index = id.find('-')
  if index == -1:
    return None
  else:
    return id[(index + 1):]


def IsAdmin(game_state, game_id, user_id):
  if user_id is None:
    return False
  return game_state.get('/games/%s/adminUsers' % game_id, user_id) is not None


def GroupToMissions(game_state, group_id):
  missions = GetValueWithPropertyEqualTo(game_state, 'missions', 'accessGroupId', group_id)
  if missions:
    return missions.keys()
  return []


def GroupToChats(game_state, group_id):
  rooms = GetValueWithPropertyEqualTo(game_state, 'chatRooms', 'accessGroupId', group_id)
  if rooms:
    return rooms.keys()
  return []

def PlayerToGame(game_state, player):
  """Map a player to a game."""
  return game_state.get('/publicPlayers/%s' % player, 'gameId')


def CopyMerge(a, b):
  a = copy.deepcopy(a)
  b = copy.deepcopy(b)
  MergeInto(a, b)
  return a

def MergeInto(a, b, path=None):
    if path is None:
      path = []
    for key in b:
        if key in a:
            if isinstance(a[key], dict) and isinstance(b[key], dict):
                MergeInto(a[key], b[key], path + [str(key)])
            elif a[key] == b[key]:
                pass # same leaf value
            else:
                raise Exception('Conflict at %s' % '.'.join(path + [str(key)]))
        else:
            a[key] = b[key]
    return a

def PlayerAllegiance(game_state, player):
  """Map a player to an allegiance."""
  return game_state.get('/publicPlayers/%s' % player, 'allegiance')


def ChatToGroup(game_state, chat):
  """Map a chat to a group."""
  return game_state.get('/chatRooms/%s' % chat, 'accessGroupId')


def ChatToGame(game_state, chat):
  """Map a chat to a group."""
  group = ChatToGroup(game_state, chat)
  if group is None:
    return None
  return GroupToGame(group)


def AddPoints(game_state, player_id, points):
  """Add points to a player."""
  player_path = '/publicPlayers/%s' % player_id
  current_points = int(game_state.get(player_path, 'points'))
  new_points = current_points + points
  game_state.put(player_path, 'points', new_points)
  print 'Player points = %d + %d => %d' % (current_points, points, new_points)


def GetValueWithPropertyEqualTo(game_state, property, key, target):
  all_values= game_state.get('/', property)
  values = {}
  if not all_values:
    return values
  for k, v in all_values.iteritems():
    if v.get(key) == target:
      values[k] = v
  return values

def FindRequestCategory(game_state, game_id, request_category_id):
  chat_rooms = game_state.get('/', 'chatRooms')
  for chat_room_id, chat_room in chat_rooms.iteritems():
    if chat_room['gameId'] == game_id:
      if 'requestCategories' in chat_room:
        if request_category_id in chat_room['requestCategories']:
          return chat_room_id
  return None

def FindRequest(game_state, game_id, request_id):
  chat_rooms = game_state.get('/', 'chatRooms')
  for chat_room_id, chat_room in chat_rooms.iteritems():
    if chat_room['gameId'] == game_id:
      if 'requestCategories' in chat_room:
        for request_category_id, request_category in chat_room['requestCategories'].iteritems():
          if 'requests' in request_category:
            if request_id in request_category['requests']:
              return chat_room_id, request_category_id
  return None, None


def GetPublicPlayerIdsInGroup(game_state, group_id):
  if not group_id:
    return []
  players = game_state.get('/groups/%s' % group_id, 'players')
  if not players:
    return []
  return players.keys()

def GetPlayerNamesInGroup(game_state, group_id):
  names = {}
  for player in GetPublicPlayerIdsInGroup(game_state, group_id):
    name = game_state.get('/publicPlayers/%s' % player, 'name')
    if not name:
      continue
    names[name] = player
  return names

def GetTime(request):
  current_time = int(time.time() * 1000)
  if 'requestTimeOffset' in request:
    current_time = current_time + request['requestTimeOffset']
  return current_time


# vim:ts=2:sw=2:expandtab
