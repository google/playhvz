import json
import logging
import requests
import uuid


IONIC_URL = 'https://api.ionic.io'


def BuildUrl(suffix):
  return '%s/%s' % (IONIC_URL, suffix)


class Ionic(object):
  """Ionic API Wrapper."""

  def __init__(self, app_id, security_tag, access_token):
    self.app_id = app_id
    self.access_token = 'Bearer %s' % access_token
    self.security_tag = security_tag
    self.Test()

  def GetHeaders(self):
    """Generate RPC headers."""
    return {
      'Authorization': self.access_token,
      'Content-Type': 'application/json',
    }

  def Test(self):
    """Validate credentials.

    Returns:
      None. Raises exception on error.
    """
    r = requests.get(BuildUrl('auth/test'), headers=self.GetHeaders())
    r.raise_for_status()

  def Post(self, url_suffix, data):
    """Post data to ionic."""
    r = requests.post(BuildUrl(url_suffix), json=data, headers=self.GetHeaders())
    r.raise_for_status()
    return r

  def SendNotification(self, devices, message, destination):
    """Send a notification to the device devices specified.

    Args:
      devices: An array of device devices to send to.
      message: Message to send in the notification.
      destination: Destination URL the notification should open.

    Returns:
      Notification response. Raises HTTPError on exception.
    """
    data = {
      'app_id': self.app_id,
      'notification': {
        'message': message,
        'payload': {
          'destination': destination,
        }
      },
      'profile': self.security_tag,
      'tokens': devices
    }

    return self.Post('push/notifications', data).json()['data']
