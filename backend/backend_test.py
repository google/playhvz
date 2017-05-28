#!/bin/python2.7

import difflib
import json
import pprint
import requests
import random
import unittest

import constants
import secrets


class Requester:
  def __init__(self):
    self.requestingUserToken = 'meh'
    self.requestingUserId = None
    self.requestingPlayerId = None

  def SetRequestingUserId(self, user_id):
    self.requestingUserId = user_id

  def SetRequestingPlayerId(self, player_id):
    self.requestingPlayerId = player_id

  def Post(self, method, data):
    data['requestingUserToken'] = self.requestingUserToken
    data['requestingUserId'] = self.requestingUserId
    data['requestingPlayerId'] = self.requestingPlayerId
    return requests.post('%s/api/%s' % (constants.TEST_ENDPOINT, method), json=data)



class EndToEndTest(unittest.TestCase):
  def AssertOk(self, method, data):
    r = self.requester.Post(method, data)
    data = " ".join(['%s="%s"' % (k, v) for k, v in data.iteritems()])
    self.assertTrue(r.ok, msg='Expected to POST 200 [ %s ] but got %d:\n%s\nfor: %s' % (method, r.status_code, r.text, data))
  
  def AssertFails(self, method, data):
    r = self.requester.Post(method, data)
    data = " ".join(['%s="%s"' % (k, v) for k, v in data.iteritems()])
    self.assertEqual(500, r.status_code,
        msg='Expected 500 but got %d for %s\n%r' % (r.status_code, method, data))

  def AssertCreateUpdateSequence(self, create_method, create_data, update_method, update_data):
    """Update fails before create but passes after. Second create fails, first passes."""
    if update_method:
      self.AssertFails(update_method, update_data)
    self.AssertOk(create_method, create_data)
    self.AssertFails(create_method, create_data)
    if update_method:
      self.AssertOk(update_method, update_data)

  def AssertDictEqual(self, expected, actual):
    msg = ('\n' + '\n'.join(difflib.ndiff(
        pprint.pformat(expected).splitlines(),
        pprint.pformat(actual).splitlines())))
    self.assertDictEqual(expected, actual, msg=msg)


  def Id(self, key, num=1):
    if key.endswith('Id'):
      key = key[:-2]
    ident = '%s-%s-%d' % (key, self.identifier, num)
    return ident

  def AssertDataMatches(self):
    # Compare a dump of the DB to the JSON string below.
    with open('backend_test_data.json') as f:
      expected_raw = f.read() % {'ident': self.identifier}

    r = self.requester.Post('DumpTestData', {'id': secrets.FIREBASE_EMAIL})
    expected = json.loads(expected_raw)
    actual = r.json()
    self.CleanTestData(actual)
    self.AssertDictEqual(expected, actual)

  def CleanTestData(self, data):
    for k, v in data.iteritems():
      if k == 'time':
        data[k] = 0
      elif type(v) == dict:
        self.CleanTestData(v)

  def setUp(self):
    self.requester = Requester()
    self.requester.Post('DeleteTestData', {'id': secrets.FIREBASE_EMAIL})
  
  def tearDown(self):
    pass
    # self.requester.Post('DeleteTestData', {'id': secrets.FIREBASE_EMAIL})

  def testEndToEnd(self):
    self.identifier = 'test-%d' % random.randint(0, 2**52)

    # Register users.
    create = {'userId': self.Id('userId')}
    self.AssertOk('register', create)
    self.AssertOk('register', create) # repeating it is fine

    self.requester.SetRequestingUserId(self.Id('userId'))

    create = {'userId': self.Id('userId', 2)}
    self.requester.Post('register', create)
    create = {'userId': self.Id('userId', 3)}
    self.requester.Post('register', create)
    create = {'userId': self.Id('userId', 4)}
    self.requester.Post('register', create)
    create = {'userId': self.Id('userId', 5)}
    self.requester.Post('register', create)

    # Create the game.
    create = {
      'gameId': self.Id('gameId'),
      'adminUserId': self.Id('userId'),
      'name': 'test Game',
      'rulesHtml': 'test rules',
      'stunTimer': 10,
      'active': True
    }
    update = {
      'gameId': self.Id('gameId'),
      'rulesHtml': 'test rule',
      'stunTimer': 5,
      'active': False
    }
    self.AssertCreateUpdateSequence('createGame', create, 'updateGame', update)

    create = {
      'gameId': self.Id('gameId'),
      'userId': self.Id('userId', 3),
    }
    self.AssertOk('addAdmin', create)
    self.AssertFails('addAdmin', create)

    # Invalid ID
    create['gameId'] = 'foo'
    self.AssertFails('createGame', create)

    # Create players.
    create_player = {
      'gameId': self.Id('gameId'),
      'userId': self.Id('userId'),
      'playerId': self.Id('playerId'),
      'name': 'test Bobby',
      'needGun': True,
      'profileImageUrl': 'http://jpg',
      'startAsZombie': "maybe",
      'gotEquipment': True,
      'beSecretZombie': "yes",
      'notes': "",
      'canInfect': False,
      'active': False,
      'notificationSettings': {
        'sound': True,
        'vibrate': True
      },
      'volunteer': {v: False for v in constants.PLAYER_VOLUNTEER_ARGS}
    }
    update = {
      'gameId': self.Id('gameId'),
      'playerId': self.Id('playerId'),
      'name': 'test Charles',
      'volunteer': {
        'server': True
      }
    }
    self.AssertCreateUpdateSequence('createPlayer', create_player, 'updatePlayer', update)
    self.requester.SetRequestingPlayerId(self.Id('playerId'))
    create_player['playerId'] = self.Id('playerId', 2)
    create_player['userId'] = self.Id('userId', 2)
    self.AssertOk('createPlayer', create_player)
    create_player['playerId'] = self.Id('playerId', 3)
    create_player['userId'] = self.Id('userId', 3)
    self.AssertOk('createPlayer', create_player)

    # Create groups
    create = {
      'groupId': self.Id('groupId'),
      'gameId': self.Id('gameId'),
      'name': 'group Foo',
      'allegianceFilter': 'none',
      'autoAdd': False,
      'autoRemove': False,
      'membersCanAdd': False,
      'membersCanRemove': False,
      'ownerPlayerId': self.Id('playerId'),
    }
    update = {
      'gameId': self.Id('gameId'),
      'groupId': self.Id('groupId'),
      'autoAdd': True,
    }
    self.AssertCreateUpdateSequence('createGroup', create, 'updateGroup', update)
    create.update({
      'gameId': self.Id('gameId'),
      'groupId': self.Id('groupId', 2),
      'name': 'group Bar',
      'membersCanAdd': True,
      'membersCanRemove': True,
    })
    self.requester.Post('createGroup', create)

    create_player['playerId'] = self.Id('playerId', 4)
    create_player['userId'] = self.Id('userId', 4)
    self.AssertOk('createPlayer', create_player)

    # Create chat rooms
    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'groupId': self.Id('groupId'),
      'name': 'test Chat',
      'withAdmins': False
    }
    update = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'name': 'test Chat Room'
    }
    self.AssertCreateUpdateSequence('createChatRoom', create, 'updateChatRoom', update)

    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId'),
      'message': 'test Message',
    }
    # update = {
    #   'gameId': self.Id('gameId'),
    #   'chatRoomId': self.Id('chatRoomId'),
    #   'playerId': self.Id('playerId'),
    #   'messageId': self.Id('messageId'),
    # }
    self.AssertOk('sendChatMessage', create)

    # Create missions
    create = {
      'gameId': self.Id('gameId'),
      'missionId': self.Id('missionId'),
      'groupId': self.Id('groupId'),
      'name': 'test Mission',
      'beginTime': 1500000000000,
      'endTime': 1600000000000,
      'detailsHtml': 'test Details',
    }
    update = {
      'gameId': self.Id('gameId'),
      'missionId': self.Id('missionId'),
      'endTime': 1700000000000,
    }
    self.AssertCreateUpdateSequence('addMission', create, 'updateMission', update)

    create_player['playerId'] = self.Id('playerId', 5)
    create_player['userId'] = self.Id('userId', 5)
    self.AssertOk('createPlayer', create_player)

    # Add players to groups.
    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId', 2),
      'groupId': self.Id('groupId')
    }
    # Owner adds player-2 to both groups
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)
    update['groupId'] = self.Id('groupId', 2)
    self.AssertOk('addPlayerToGroup', update)

    self.requester.SetRequestingUserId(self.Id('userId', 2))
    self.requester.SetRequestingPlayerId(self.Id('playerId', 2))

    # Player-2 cant add player-3 to group 1, because membersCanAdd is false
    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId', 3),
      'groupId': self.Id('groupId')
    }
    self.AssertFails('addPlayerToGroup', update)

    # Player-2 CAN add player-3 to group 2, because membersCanAdd is true
    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId', 3),
      'groupId': self.Id('groupId', 2)
    }
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)

    update = {
      'gameId': self.Id('gameId'),
      'playerToRemoveId': self.Id('playerId', 3),
      'groupId': self.Id('groupId', 2)
    }
    self.AssertOk('removePlayerFromGroup', update)
    self.AssertFails('removePlayerFromGroup', update)

    # Create and assign guns
    create = {'gunId': self.Id('gunId'), 'label': "1404"}
    update = {'gunId': self.Id('gunId'), 'playerId': self.Id('playerId')}
    self.AssertCreateUpdateSequence('addGun', create, 'assignGun', update)

    create = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'name': 'test Reward',
      'points': 8,
      'limitPerPlayer': 2,
      'shortName': 'testrew',
    }
    update = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'points': 5,
    }
    self.AssertCreateUpdateSequence('addRewardCategory', create, 'updateRewardCategory', update)

    # Add and claim some rewards
    create = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'rewardId': self.Id('reward'),
      'code': 'testrew-purple-striker-balloon'
    }
    self.AssertOk('addReward', create)
    self.AssertFails('addReward', create)
    
    claim = {
      'gameId': self.Id('gameId'),
      'playerId': self.Id('playerId'),
      'rewardCode': 'testrew-purple-striker-balloon',
    }
    self.AssertCreateUpdateSequence('claimReward', claim, None, None)
    self.AssertDataMatches()


if __name__ == '__main__':
  unittest.main()




  # def GetFirebase(self):
  #   auth = firebase.FirebaseAuthentication(
  #       secrets.FIREBASE_SECRET, secrets.FIREBASE_EMAIL, admin=True)
  #   db = firebase.FirebaseApplication(
  #       'https://trogdors-29fa4.firebaseio.com', authentication=auth)
  #   return db

# vim:ts=2:sw=2:expandtab
