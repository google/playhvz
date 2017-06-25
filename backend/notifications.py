import logging
import random
import db_helpers as helpers
import time

import ionic
import config

def HandleNotification(game_state, queued_notification_id, queued_notification):
  """Helper function to propogate a notification."""

  if 'playerId' in queued_notification and queued_notification['playerId'] is not None:
    public_player_ids = [queued_notification['playerId']]
  elif 'groupId' in queued_notification:
    public_player_ids = game_state.get('/groups/%s' % queued_notification['groupId'], 'players')
    if public_player_ids is None:
      public_player_ids = []
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
    }
    private_player_id = helpers.GetPrivatePlayerId(game_state, public_player_id)
    game_state.put('/privatePlayers/%s/notifications' % private_player_id,
                  notification_id, notification)

    if queued_notification['mobile']:
      user_id = game_state.get('/publicPlayers/%s' % queued_notification['gameId'], 'userId')
      user = game_state.get('/users', user_id)
      if 'deviceToken' in user:
        tokens.add(user['deviceToken'])

  # TODO: Send notification to device_tokens


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
