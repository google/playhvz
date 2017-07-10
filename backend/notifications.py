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


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
import logging
import random
import db_helpers as helpers
import time

import config
import pyfcm

if config.FIREBASE_APIKEY:
  fcm = pyfcm.FCMNotification(api_key=config.FIREBASE_APIKEY)

def HandleNotification(game_state, queued_notification_id, queued_notification):
  """Helper function to propogate a notification."""
  game_id = queued_notification['gameId']

  if 'playerId' in queued_notification and queued_notification['playerId'] is not None:
    public_player_ids = [queued_notification['playerId']]
  elif 'groupId' in queued_notification:
    public_player_ids = game_state.get('/groups/%s' % queued_notification['groupId'], 'players')
    if public_player_ids is None:
      public_player_ids = []
    else:
      public_player_ids = sorted(public_player_ids)
  else:
    logging.error('Queued notification %s does not have a playerId or a groupId!' % (
        queued_notification_id))
    return

  device_tokens = []

  for index, public_player_id in enumerate(public_player_ids):
    notification_id = queued_notification_id.replace('queuedNotification-', 'notification-', 1) + '-' + str(index)
    notification = {
      'queuedNotificationId': queued_notification_id,
      'message': queued_notification['message'],
      'previewMessage': queued_notification['previewMessage'],
      'destination': queued_notification['destination'],
      'time': int(time.time() * 1000),
      'icon': queued_notification['icon'] if 'icon' in queued_notification else None,
      'sound': queued_notification['sound'] if 'sound' in queued_notification else None,
    }
    private_player_id = helpers.GetPrivatePlayerId(game_state, public_player_id)
    game_state.put('/privatePlayers/%s/notifications' % private_player_id,
                  notification_id, notification)

    if queued_notification['mobile']:
      user_id = game_state.get('/publicPlayers/%s' % public_player_id, 'userId')
      user = game_state.get('/users', user_id)
      if 'deviceToken' in user:
        device_tokens.append(user['deviceToken'])
  if len(device_tokens) == 0:
    return
  if config.FIREBASE_APIKEY:
    notification['destination'] = 'http://playhvz.com/%s' % notification['destination']

    fcm.notify_multiple_devices(registration_ids=list(set(device_tokens)),
                                message_title=queued_notification['previewMessage'],
                                message_body=queued_notification['message'],
                                sound=queued_notification['sound'],
                                data_message=notification)

def ExecuteNotifications(request, game_state):
  """Send the notifications.

  This method will execute queued notifications and send them to apps and add
  them to the player specific notification database URLs.

  Changes 'sent' from False to True once it's sent.

  We iterate over the entire set of notifications in existence currently. Soon,
  we'll iterate over all notifications in the given game id.
  """
  current_time = int(time.time() * 1000)
  while True:
    updates = False
    queued_notifications = game_state.get('/queuedNotifications', None)
    if queued_notifications is None:
      return
    for queued_notification_id, queued_notification in queued_notifications.iteritems():
      send_time = queued_notification['sendTime'] if 'sendTime' in queued_notification else None
      sent = queued_notification['sent']
      if not sent and (send_time is None or send_time < current_time):
        updates = True
        HandleNotification(game_state, queued_notification_id, queued_notification)
        game_state.patch('/queuedNotifications/%s' % queued_notification_id, {'sent': True})
    if not updates:
      return
