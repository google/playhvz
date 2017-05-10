import logging
import time


def HandleNotification(firebase, notification_id, notification):
  """Helper function to propogate a notification."""

  # TODO: Send to ionic
  if 'playerId' in notification:
    players = [notification['playerId']]
  elif 'groupId' in notification:
    players = firebase.get('/groups/%s' % notification['groupId'],
                           'players')
  else:
    logging.error('Notification %s does not have a playerId or a groupId!' % (
        notification_id))
    return

  for player in players:
    firebase.put('/players/%s/notifications' % player,
                  notification_id, notification)


def ExecuteNotifications(request, firebase):
  """INTERNAL ONLY: Send the notifications.

  This method will execute queued notifications and send them to apps and add
  them to the player specific notification database URLs.
  """
  # Handle notifications, 20 at a time so we don't need to get the entire
  # notification database.
  get_params = {
      'orderBy': '"sent"',
      'limitToLast': 20
  }
  current_time = int(time.time())
  while True:
    updates = False
    notifications = firebase.get('/notifications', None, params=get_params)
    if notifications is None:
      return
    for notification_id, notification in notifications.iteritems():
      if 'sent' not in notification and current_time > int(notification['sendTime']):
        updates = True
        HandleNotification(firebase, notification_id, notification)
        notifications[notification_id]['sent'] = True
    if updates:
      result = firebase.patch('/notifications', notifications)
      if result is None:
        logging.error('Error updating notification results for %s...' % notification_id)
    else:
      return
