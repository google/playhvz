#!/bin/python2.7

import difflib
import json
import pprint
import requests
import time
import unittest

import constants


class EndToEndTest(unittest.TestCase):

  host = constants.TEST_ENDPOINT

  def Post(self, method, data):
    return requests.post('%s/api/%s' % (self.host, method), json=data)

  def GetFirebase(self):
    auth = firebase.FirebaseAuthentication(
				constants.FIREBASE_SECRET, constants.FIREBASE_EMAIL, admin=True)
    db = firebase.FirebaseApplication(
				'https://trogdors-29fa4.firebaseio.com', authentication=auth)
    return db

  def AssertOk(self, method, data):
    r = self.Post(method, data)
    self.assertTrue(r.ok, msg='Expected to POST successfully but got: %s\n%s\nfor %s\n%s' % (r.status_code, r.text, method, data))
  
  def AssertFails(self, method, data):
    r = self.Post(method, data)
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


  def Id(self, key):
    if key.endswith('Id'):
      key = key[:-2]
    return '%s-%s' % (key, self.identifier)

  def setUp(self):
    self.Post('DeleteTestData', {'id': constants.FIREBASE_EMAIL})
  
  def tearDown(self):
    pass
    # self.Post('DeleteTestData', {'id': constants.FIREBASE_EMAIL})
  
  def testEndToEnd(self):
    self.identifier = 'test_%d' % (time.time() % 1000)

    # Register. Should work then fails.
    create = {'userId': self.Id('userId')}
    self.AssertOk('register', create)
    self.AssertFails('register', create)

    # Create and update game.
    create = {
      'gameId': self.Id('gameId'),
      'userId': self.Id('userId'),
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

    # Invalid ID
    create['gameId'] = 'foo'
    self.AssertFails('createGame', create)

    # Create/Update player
    create = {
      'gameId': self.Id('gameId'),
      'userId': self.Id('userId'),
      'playerId': self.Id('playerId'),
      'name': 'test Bobby',
      'needGun': True,
      'profileImageUrl': 'http://jpg',
      'startAsZombie': True,
      'volunteer': True,
      'beSecretZombie': True,
      'notifySound': True,
      'notifyVibrate': True,
    }
    update = {
      'playerId': self.Id('playerId'),
      'name': 'test Charles',
      'volunteer': False,
    }
    self.AssertCreateUpdateSequence('createPlayer', create, 'updatePlayer', update)

    create = {
      'groupId': self.Id('groupId'),
      'gameId': self.Id('gameId'),
      'allegiance': 'none',
      'autoAdd': False,
      'autoRemove': False,
      'membersCanAdd': False,
      'membersCanRemove': False,
      'playerId': self.Id('playerId'),
    }
    update = {
      'groupId': self.Id('groupId'),
      'autoRemove': False,
    }
    self.AssertCreateUpdateSequence('createGroup', create, 'updateGroup', update)

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

    create = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'rewardId': 'reward-%s-bleck' % self.identifier,
    }
    self.AssertCreateUpdateSequence('addReward', create, None, None)
    
    claim = {
      'playerId': self.Id('playerId'),
      'rewardId': 'reward-%s-bleck' % self.identifier,
    }
    self.AssertCreateUpdateSequence('claimReward', claim, None, None)

    # Compare a dump of the DB to the JSON string below.
    expected_raw_data = '{"chatRooms":{},"games":{"game-%(ident)s":{"active":true,"adminUserId":"%(ident)s","groups":{"group-%(ident)s":{"a":true}},"name":"test Game","players":{"player-%(ident)s":{"allegiance":"horde","claims":{"reward-%(ident)s-bleck":{"rewardCategoryId":"rewardCategory-%(ident)s","time":0}},"name":"test Charles","points":5,"profileImageUrl":"http://jpg","user_id":"%(ident)s","volunteer":false}},"rewardCategories":{"rewardCategory-%(ident)s":{"claimed":1,"name":"test Reward","points":5,"rewards":{"reward-%(ident)s-bleck":{"a":true,"playerId":"player-%(ident)s"}}}},"rulesHtml":"test rule","stunTimer":5}},"groups":{"group-%(ident)s":{"allegiance":"horde","autoAdd":true,"autoRemove":false,"gameId":"game-%(ident)s","membersCanAdd":false,"membersCanRemove":false,"players":{"player-%(ident)s":{"a":true}}}},"guns":{"gun-%(ident)s":{"playerId":"player-%(ident)s"}},"missions":{"mission-%(ident)s":{"allegiance":"resistance","begin":1,"detailsHtml":"test Details","end":0,"name":"test Mission"}},"players":{"player-%(ident)s":{"notificationSettings":{"sound":true,"vibrate":true},"canInfect":true,"gameId":"game-%(ident)s","needGun":true,"startAsZombie":true,"userId":"user-%(ident)s","volunteer":true,"wantsToBeSecretZombie":true}},"users":{"%(ident)s":{"a":true,"players":{"player-%(ident)s":{"gameId":"game-%(ident)s"}}}}}' % {'ident': self.identifier}
    r = self.Post('DumpTestData', {'id': constants.FIREBASE_EMAIL})
    expected = json.loads(expected_raw_data)
    actual = r.json()
    a = actual['games']
    a = a[list(a)[0]]['players']
    a = a[list(a)[0]]['claims']
    a[list(a)[0]]['time'] = 0
    self.AssertDictEqual(expected, actual)


# Endpoints not yet tested
#  createChatRoom
#  addPlayerToChat
#  sendChatMessage


if __name__ == '__main__':
  unittest.main()


# vim:ts=2:sw=2:expandtab
