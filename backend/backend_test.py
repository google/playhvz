#!/bin/python2.7

import difflib
import json
import pprint
import requests
import time
import unittest

import constants
import secrets


class EndToEndTest(unittest.TestCase):

  host = constants.TEST_ENDPOINT

  def Post(self, method, data):
    return requests.post('%s/api/%s' % (self.host, method), json=data)

  def GetFirebase(self):
    auth = firebase.FirebaseAuthentication(
        secrets.FIREBASE_SECRET, secrets.FIREBASE_EMAIL, admin=True)
    db = firebase.FirebaseApplication(
        'https://humansvszombies-24348.firebaseio.com', authentication=auth)
    return db

  def AssertOk(self, method, data):
    r = self.Post(method, data)
    data = " ".join(['%s="%s"' % (k, v) for k, v in data.iteritems()])
    self.assertTrue(r.ok, msg='Expected to POST 200 [ %s ] but got %d:\n%s\nfor: %s' % (method, r.status_code, r.text, data))
  
  def AssertFails(self, method, data):
    r = self.Post(method, data)
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


  def Id(self, key, num=0):
    if key.endswith('Id'):
      key = key[:-2]
    ident = '%s-%s' % (key, self.identifier)
    if num:
      ident = '%s-%d' % (ident, num)
    return ident

  def AssertDataMatches(self):
    # Compare a dump of the DB to the JSON string below.
    with open('backend_test_data.json') as f:
      expected_raw = f.read() % {'ident': self.identifier}

    r = self.Post('DumpTestData', {'id': secrets.FIREBASE_EMAIL})
    expected = json.loads(expected_raw)
    actual = r.json()
    self.CleanTestData(actual)
    self.AssertDictEqual(expected, actual)

  def CleanTestData(self, data):
    for k, v in data.iteritems():
      if k == 'number':
        data[k] = 100
      elif k == 'time':
        data[k] = 0
      elif k == 'acks':
        for playerId in v:
          v[playerId] = 0
      elif type(v) == dict:
        self.CleanTestData(v)

  def setUp(self):
    self.Post('DeleteTestData', {'id': secrets.FIREBASE_EMAIL})
  
  def tearDown(self):
    pass
    # self.Post('DeleteTestData', {'id': secrets.FIREBASE_EMAIL})
  
  def testEndToEnd(self):
    self.identifier = 'test_%d' % (time.time() % 1000)

    # Register users.
    create = {'userId': self.Id('userId'), 'name': 'Angel'}
    self.AssertOk('register', create)
    self.AssertFails('register', create)

    create = {'userId': '%s-2' % self.Id('userId'), 'name': 'Bob'}
    self.Post('register', create)
    create = {'userId': '%s-3' % self.Id('userId'), 'name': 'Charles'}
    self.Post('register', create)

    # Create the game.
    create = {
      'gameId': self.Id('gameId'),
      'adminUserId': self.Id('userId'),
      'name': 'test Game',
      'rulesHtml': 'test rules',
      'stunTimer': 10,
    }
    update = {
      'gameId': self.Id('gameId'),
      'rulesHtml': 'test rule',
      'stunTimer': 5,
    }
    self.AssertCreateUpdateSequence('createGame', create, 'updateGame', update)

    create = {
      'gameId': self.Id('gameId'),
      'userId': '%s-2' % self.Id('userId'),
    }
    self.AssertOk('addGameAdmin', create)
    self.AssertFails('addGameAdmin', create)

    # Invalid ID
    create['gameId'] = 'foo'
    self.AssertFails('createGame', create)

    # Create players.
    create = {
      'gameId': self.Id('gameId'),
      'userId': self.Id('userId'),
      'playerId': self.Id('playerId'),
      'name': 'test Bobby',
      'needGun': True,
      'profileImageUrl': 'http://jpg',
      'startAsZombie': True,
      'gotEquipment': True,
      'beSecretZombie': True,
      'notifySound': True,
      'notifyVibrate': True,
    }
    create.update({v: False for v in constants.PLAYER_VOLUNTEER_ARGS})
    update = {
      'playerId': self.Id('playerId'),
      'name': 'test Charles',
      'helpServer': True,
    }
    self.AssertCreateUpdateSequence('createPlayer', create, 'updatePlayer', update)
    create['playerId'] = self.Id('playerId', 2)
    self.AssertOk('createPlayer', create)
    create['playerId'] = self.Id('playerId', 3)
    self.AssertOk('createPlayer', create)

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
      'groupId': self.Id('groupId'),
      'autoRemove': False,
    }
    self.AssertCreateUpdateSequence('createGroup', create, 'updateGroup', update)
    create.update({
      'groupId': self.Id('groupId', 2),
      'name': 'group Bar',
      'membersCanAdd': True
    })
    self.Post('createGroup', create)

    # Create chat rooms
    create = {
      'chatRoomId': self.Id('chatRoomId'),
      'groupId': self.Id('groupId'),
      'name': 'test Chat',
      'withAdmins': False
    }
    update = {
      'chatRoomId': self.Id('chatRoomId'),
      'name': 'test Chat Room'
    }
    self.AssertCreateUpdateSequence('createChatRoom', create, 'updateChatRoom', update)

    create = {
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId'),
      'message': 'test Message',
    }
    update = {
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId'),
    }
    self.AssertCreateUpdateSequence('sendChatMessage', create, 'ackChatMessage', update)

    # Create missions
    create = {
      'missionId': self.Id('missionId'),
      'groupId': self.Id('groupId'),
      'name': 'test Mission',
      'begin': 1,
      'end': 2,
      'detailsHtml': 'test Details',
    }
    update = {
      'missionId': self.Id('missionId'),
      'end': 0,
    }
    self.AssertCreateUpdateSequence('addMission', create, 'updateMission', update)

    # Add players to groups.
    update = {
      'playerId': self.Id('playerId'),
      'otherPlayerId': self.Id('playerId', 2),
      'groupId': self.Id('groupId')
    }
    # Owner adds player-2 to both groups
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)
    update['groupId'] = self.Id('groupId', 2)
    self.AssertOk('addPlayerToGroup', update)
    # Player-2 can add player-3 to one group but not other -- membersCanAdd
    update = {
      'playerId': self.Id('playerId', 2),
      'otherPlayerId': self.Id('playerId', 3),
      'groupId': self.Id('groupId')
    }
    self.AssertFails('addPlayerToGroup', update)
    update['groupId'] = self.Id('groupId', 2)
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)

    # Create and assign guns
    create = {'gunId': self.Id('gunId')}
    update = {'gunId': self.Id('gunId'), 'playerId': self.Id('playerId')}
    self.AssertCreateUpdateSequence('addGun', create, 'assignGun', update)

    create = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'name': 'test Reward',
      'points': 8,
      'limitPerPlayer': 2,
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
      'rewardId': 'reward-%s-bleck' % self.identifier,
    }
    self.AssertOk('addReward', create)
    self.AssertFails('addReward', create)
    
    claim = {
      'playerId': self.Id('playerId'),
      'rewardId': 'reward-%s-bleck' % self.identifier,
    }
    self.AssertCreateUpdateSequence('claimReward', claim, None, None)
    self.AssertDataMatches()


if __name__ == '__main__':
  unittest.main()


# vim:ts=2:sw=2:expandtab
