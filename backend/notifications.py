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
    if players is None:
      players = []
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

  This method works by fetching the last 20 notifications that are less than
  the current time. Once the notifications are handled, their time is set to 0
  indicating that they have been handled. Since now that they are zero, all
  future notifications must have a newer timestamp, and thus will show up in
  the query first.
  """
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
        HandleNotification(firebase, notification_id, notification)
        notifications[notification_id]['sendTime'] = 0
    if updates:
      result = firebase.patch('/notifications', notifications)
      if result is None:
        logging.error('Error updating notification results for %s...' % notification_id)
    else:
      return
