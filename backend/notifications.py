import logging
import time

import ionic
import config

def HandleNotification(firebase, ionic_client, notification_id, notification):
  """Helper function to propogate a notification."""

  # TODO: Send to ionic
  if 'playerId' in notification:
    players = set(notification['playerId'])
  elif 'groupId' in notification:
    players = firebase.get('/groups/%s' % notification['groupId'],
                           'players')
    if players is None:
      players = []
    else:
      players = set(players)
  else:
    logging.error('Notification %s does not have a playerId or a groupId!' % (
        notification_id))
    return

  for player in players:
    firebase.put('/playersPrivate/%s/notifications' % player,
                  notification_id, notification)

  if 'app' in notification:
    # This is really depressing... This is only barely acceptable because we
    # expect less than 100 players for the minigame.
    users = firebase.get('/users', None)
    tokens = set()
    if users is None:
      logging.error('Error querying all users.')
      return
    for user in users.values():
      if 'players' in user:
        for player in user['players']:
          if player in players and 'deviceToken' in user:
            tokens.add(user['deviceToken'])
    ionic_client.SendNotification(tokens, notification['message'],
                                  notification['destination'])


def ExecuteNotifications(request, firebase):
  """INTERNAL ONLY: Send the notifications.

  This method will execute queued notifications and send them to apps and add
  them to the player specific notification database URLs.

  This method works by fetching the last 20 notifications that are less than
  the current time. Once the notifications are handled, their time is set to 0
  indicating that they have been handled. Since now that they are zero, all
  future notifications must have a newer timestamp, and thus will show up in
  the query first.
  """
  ionic_client = ionic.Ionic(config.IONIC_APPID, config.IONIC_SECURITY_TAG,
                             config.IONIC_TOKEN)
  # Handle notifications, 20 at a time so we don't need to get the entire
  # notification database.
  current_time = int(time.time())
  get_params = {
      'orderBy': '"sendTime"',
      'limitToLast': 20,
      'endAt': current_time
  }
  while True:
    updates = False
    notifications = firebase.get('/notifications', None, params=get_params)
    if notifications is None:
      return
    for notification_id, notification in notifications.iteritems():
      if notification['sendTime'] > 0 and current_time > int(notification['sendTime']):
        updates = True
        HandleNotification(firebase, ionic_client, notification_id, notification)
        notifications[notification_id]['sendTime'] = 0
    if updates:
      result = firebase.patch('/notifications', notifications)
      if result is None:
        logging.error('Error updating notification results for %s...' % notification_id)
    else:
      return
