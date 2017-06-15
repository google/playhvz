#!/bin/python2.7

import difflib
import json
import pprint
import requests
import random
import unittest

import constants
import config


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

  def AssertFails(self, method, data, expected_status = 500):
    r = self.requester.Post(method, data)
    data = " ".join(['%s="%s"' % (k, v) for k, v in data.iteritems()])
    self.assertEqual(expected_status, r.status_code,
        msg='Expected 500 but got %d for %s\n%r' % (r.status_code, method, data))

  def AssertCreateUpdateSequence(self, create_method, create_data, update_method, update_data, fail_code=500):
    """Update fails before create but passes after. Second create fails, first passes."""
    if update_method:
      self.AssertFails(update_method, update_data, fail_code)
    self.AssertOk(create_method, create_data)
    self.AssertFails(create_method, create_data, fail_code)
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

  def AssertDataMatches(self, use_local):
    # Compare a dump of the DB to the JSON string below.
    with open('backend_test_data.json') as f:
      expected_raw = f.read() % {'ident': self.identifier}

    r = self.requester.Post('DumpTestData', {'id': config.FIREBASE_EMAIL, 'use_local': use_local})
    expected = json.loads(expected_raw)
    actual = r.json()
    self.CleanTestData(actual)
    self.AssertDictEqual(expected, actual)

  def CleanTestData(self, data):
    for k, v in data.iteritems():
      if k in ['time', 'sendTime']:
        data[k] = 0
      elif type(v) == dict:
        self.CleanTestData(v)

  def setUp(self):
    self.requester = Requester()
    self.requester.Post('DeleteTestData', {'id': config.FIREBASE_EMAIL})

  def tearDown(self):
    pass
    # self.requester.Post('DeleteTestData', {'id': config.FIREBASE_EMAIL})

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
      'active': True,
      'name': 'test Game',
      'rulesHtml': 'test rules',
      'faqHtml': 'test faq',
      'stunTimer': 10,
      'registrationEndTime': 1506884521000,
      'startTime': 1606884521000,
      'endTime': 1706884521000,
    }
    update = {
      'gameId': self.Id('gameId'),
      'rulesHtml': 'test rule 2',
      'faqHtml': 'test faq 2',
      'stunTimer': 5,
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
      'name': 'testBobby',
      'needGun': True,
      'profileImageUrl': 'http://jpg',
      'gotEquipment': True,
      'wantToBeSecretZombie': True,
      'beInPhotos': True,
      'notes': "",
      'beInPhotos': True,
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
      'name': 'testCharles',
      'volunteer': {
        'server': True
      }
    }
    self.AssertCreateUpdateSequence('createPlayer', create_player, 'updatePlayer', update)
    self.requester.SetRequestingPlayerId(self.Id('playerId'))
    create_player['playerId'] = self.Id('playerId', 2)
    create_player['userId'] = self.Id('userId', 2)
    create_player['name'] = '%s2' % create_player['name']
    self.AssertOk('createPlayer', create_player)
    create_player['playerId'] = self.Id('playerId', 3)
    create_player['userId'] = self.Id('userId', 3)
    create_player['name'] = '%s3' % create_player['name'][:-1]
    self.AssertOk('createPlayer', create_player)

    # Create groups
    create = {
      'groupId': self.Id('groupId'),
      'gameId': self.Id('gameId'),
      'name': 'group Foo',
      'allegianceFilter': 'none',
      'autoAdd': False,
      'autoRemove': False,
      'canAddOthers': False,
      'canRemoveOthers': False,
      'canAddSelf': False,
      'canRemoveSelf': False,
      'ownerPlayerId': self.Id('playerId'),
    }
    update = {
      'gameId': self.Id('gameId'),
      'groupId': self.Id('groupId'),
      'autoAdd': True,
    }
    self.AssertCreateUpdateSequence('createGroup', create, 'updateGroup', update)

    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId'),
      'groupId': self.Id('groupId'),
      'actingPlayerId': self.Id('playerId'),
    }
    self.AssertOk('addPlayerToGroup', update)


    create.update({
      'gameId': self.Id('gameId'),
      'groupId': self.Id('groupId', 2),
      'name': 'group Bar',
      'canAddOthers': True,
      'canRemoveOthers': True,
      'canAddSelf': True,
      'canRemoveSelf': True,
    })
    self.requester.Post('createGroup', create)

    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId'),
      'groupId': self.Id('groupId', 2),
      'actingPlayerId': self.Id('playerId'),
    }
    self.AssertOk('addPlayerToGroup', update)


    create_player['playerId'] = self.Id('playerId', 4)
    create_player['userId'] = self.Id('userId', 4)
    self.AssertOk('createPlayer', create_player)

    # Create chat rooms
    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'accessGroupId': self.Id('groupId'),
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
      'message': '@testCharles @testBobby test single Message',
    }
    self.AssertOk('sendChatMessage', create)

    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId', 2),
      'message': 'test Message',
      'image': {
        'url': 'google.com/image.png',
      }
    }
    self.AssertOk('sendChatMessage', create)

    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId', 3),
      'message': 'test Message',
      'location': {
        'latitude': 34.5645654,
        'longitude': -124.5345234,
      }
    }
    self.AssertOk('sendChatMessage', create)

    create = {
      'gameId': self.Id('gameId'),
      'chatRoomId': self.Id('chatRoomId'),
      'playerId': self.Id('playerId'),
      'messageId': self.Id('messageId', 4),
      'message': '@all test all Message',
      'image': {
        'url': 'google.com/image.png',
      }
    }
    self.AssertOk('sendChatMessage', create)

    create = {
      'gameId': self.Id('gameId'),
      'queuedNotificationId': self.Id('queuedNotification'),
      'message': 'hello!',
      'previewMessage': 'hell',
      'site': True,
      'mobile': False,
      'vibrate': False,
      'sound': False,
      'destination': 'http://some.url/moo',
      'sendTime': None,
      'playerId': None,
      'groupId': self.Id('groupId'),
      'icon': 'icons:close'
    }
    self.AssertOk('sendNotification', create)

    self.AssertOk('executeNotifications', {})

    # Create missions
    create = {
      'gameId': self.Id('gameId'),
      'missionId': self.Id('missionId'),
      'accessGroupId': self.Id('groupId'),
      'name': 'test Mission',
      'beginTime': 1500000000000,
      'endTime': 1600000000000,
      'detailsHtml': 'test Details',
      'rsvpersGroupId': self.Id('groupId'),
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
      'groupId': self.Id('groupId'),
      'actingPlayerId': self.Id('playerId'),
    }
    # Owner adds player-2 to both groups
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)
    update['groupId'] = self.Id('groupId', 2)
    self.AssertOk('addPlayerToGroup', update)

    self.requester.SetRequestingUserId(self.Id('userId', 2))
    self.requester.SetRequestingPlayerId(self.Id('playerId', 2))

    # Player-2 cant add player-3 to group 1, because canAddOthers is false
    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId', 3),
      'groupId': self.Id('groupId'),
      'actingPlayerId': self.Id('playerId', 2),
    }
    self.AssertFails('addPlayerToGroup', update)

    # Player-2 CAN add player-3 to group 2, because canAddOthers is true
    update = {
      'gameId': self.Id('gameId'),
      'playerToAddId': self.Id('playerId', 3),
      'groupId': self.Id('groupId', 2),
      'actingPlayerId': self.Id('playerId', 2),
    }
    self.AssertOk('addPlayerToGroup', update)
    self.AssertFails('addPlayerToGroup', update)

    update = {
      'gameId': self.Id('gameId'),
      'playerToRemoveId': self.Id('playerId', 3),
      'groupId': self.Id('groupId', 2),
      'actingPlayerId': self.Id('playerId', 2),
    }
    self.AssertOk('removePlayerFromGroup', update)
    self.AssertFails('removePlayerFromGroup', update)

    # Create and assign guns
    create = {'gameId': self.Id('gameId'), 'gunId': self.Id('gunId'), 'label': "1404"}
    update = {'gameId': self.Id('gameId'), 'gunId': self.Id('gunId'), 'playerId': self.Id('playerId')}
    self.AssertCreateUpdateSequence('addGun', create, 'assignGun', update)

    create = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'name': 'test Reward',
      'points': 8,
      'limitPerPlayer': 2,
      'shortName': 'testrew',
      'badgeImageUrl': 'google.com/someimage.png',
      'description': 'this is a cool reward',
    }
    update = {
      'gameId': self.Id('gameId'),
      'rewardCategoryId': self.Id('rewardCategoryId'),
      'points': 5,
      'description': 'this is a VERY cool reward',
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

    # Create Maps
    create = {
      'accessGroupId': self.Id('groupId'),
      'gameId': self.Id('gameId'),
      'mapId': self.Id('mapId', 1),
      'name': "Test map 1" ,
    }
    self.AssertOk('createMap', create)

    create = {
      'accessGroupId': self.Id('groupId', 2),
      'gameId': self.Id('gameId'),
      'mapId': self.Id('mapId', 2),
      'name': "Test map 2" ,
    }
    self.AssertOk('createMap', create)
    self.AssertFails('createMap', create)

    # Create Markers
    self.requester.SetRequestingPlayerId(self.Id('playerId'))

    create = {
      'color': '187C09',
      'latitude': 12.4,
      'longitude': 14.5,
      'mapId': self.Id('mapId', 1),
      'markerId': self.Id('markerId', 1),
      'name': 'Test marker 1',
      'playerId': self.Id('playerId', 1),
    }
    self.AssertOk('addMarker', create)

    create = {
      'color': '187C09',
      'latitude': 12.4,
      'longitude': 14.5,
      'mapId': self.Id('mapId', 1),
      'markerId': self.Id('markerId', 2),
      'name': 'Test marker 2',
      'playerId': self.Id('playerId', 1),
    }
    self.AssertOk('addMarker', create)

    create = {
      'color': '187C09',
      'latitude': 12.4,
      'longitude': 14.5,
      'mapId': self.Id('mapId', 2),
      'markerId': self.Id('markerId', 3),
      'name': 'Test marker 3',
      'playerId': self.Id('playerId', 1),
    }
    self.AssertOk('addMarker', create)

    create = {
      'color': '187C09',
      'latitude': 12.4,
      'longitude': 14.5,
      'mapId': self.Id('mapId', 2),
      'markerId': self.Id('markerId', 4),
      'name': 'Test marker 4',
      'playerId': self.Id('playerId', 1),
    }
    self.AssertOk('addMarker', create)

    # Update all points
    update = {
      'latitude': 16.0,
      'longitude': 17.0,
      'playerId': self.Id('playerId', 1),
    }
    self.AssertOk('updatePlayerMarkers', update)

    # Create quiz question
    create = {
      'gameId': self.Id('gameId', 1),
      'quizQuestionId': self.Id('quizQuestionId', 1),
      'text': 'Test question 1',
      'type': 'a wrong type'
    }
    self.AssertFails('addQuizQuestion', create, 400)

    create['type'] = 'order'
    self.AssertOk('addQuizQuestion', create)
    self.AssertFails('addQuizQuestion', create, 400)

    create['quizQuestionId'] = self.Id('quizQuestionId', 2)
    create['text'] = 'Test question 2'
    self.AssertOk('addQuizQuestion', create)

    # Update quiz questions
    update = {
      'gameId': self.Id('gameId', 1),
      'quizQuestionId': self.Id('quizQuestionId', 2),
      'type': 'wrong type in update'
    }
    self.AssertFails('updateQuizQuestion', update, 400)

    update['type'] = 'multipleChoice'
    self.AssertOk('updateQuizQuestion', update)

    update['quizQuestionId'] = 'non-existent id'
    self.AssertFails('updateQuizQuestion', update, 400)

    # Quiz answers
    create = {
      'gameId': self.Id('gameId', 1),
      'isCorrect': True,
      'order': 17,
      'quizAnswerId': self.Id('quizAnswerId', 1),
      'quizQuestionId': self.Id('quizQuestionId', 1),
      'text': 'Test answer',
    }

    update = {
      'gameId': self.Id('gameId', 1),
      'quizAnswerId': self.Id('quizAnswerId', 1),
      'quizQuestionId': self.Id('quizQuestionId', 1),
      'order': 13,
    }
    self.AssertCreateUpdateSequence(
      'addQuizAnswer',
      create,
      'updateQuizAnswer',
      update,
      400)

    # Final keep last
    self.AssertDataMatches(True)
    self.AssertDataMatches(False)


if __name__ == '__main__':
  unittest.main()




  # def GetFirebase(self):
  #   auth = firebase.FirebaseAuthentication(
  #       config.FIREBASE_SECRET, config.FIREBASE_EMAIL, admin=True)
  #   db = firebase.FirebaseApplication(
  #       'https://trogdors-29fa4.firebaseio.com', authentication=auth)
  #   return db

# vim:ts=2:sw=2:expandtab
