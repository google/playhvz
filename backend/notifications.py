import logging
import random
import time

import config
import pyfcm

fcm = pyfcm.FCMNotification(api_key=config.FIREBASE_APIKEY)

def HandleNotification(game_state, queued_notification_id, queued_notification):
  """Helper function to propogate a notification."""

  if 'playerId' in queued_notification and queued_notification['playerId'] is not None:
    player_ids = set([queued_notification['playerId']])
  elif 'groupId' in queued_notification:
    player_ids = game_state.get('/groups/%s' % queued_notification['groupId'], 'players')
    if player_ids is None:
      player_ids = []
    else:
      player_ids = set(player_ids.keys())
  else:
    logging.error('Queued notification %s does not have a playerId or a groupId!' % (
        queued_notification_id))
    return

  tokens = set()

  for index, player_id in enumerate(player_ids):
    notification_id = queued_notification_id.replace('queuedNotification-', 'notification-', 1) + '-' + str(index)
    notification = {
      'queuedNotificationId': queued_notification_id,
      'message': queued_notification['message'],
      'previewMessage': queued_notification['previewMessage'],
      'destination': queued_notification['destination'],
      'time': int(time.time() * 1000),
      'icon': queued_notification['icon'] if 'icon' in queued_notification else None,
    }
    game_state.put('/playersPrivate/%s/notifications' % player_id,
                  notification_id, notification)

    if queued_notification['mobile']:
      user_id = game_state.get('/playersPublic/%s' % player_id, 'userId')
      user = game_state.get('/users', user_id)
      if 'deviceToken' in user:
        tokens.add(user['deviceToken'])
  if len(tokens) == 0:
    return
  fcm.notify_multiple_devices(registration_ids=list(tokens),
                              message_title=notification['previewMessage'],
                              message_body=notification['message'])

def ExecuteNotifications(request, game_state):
  """INTERNAL ONLY: Send the notifications.

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
