from flask import abort, Flask, jsonify, make_response, request, g
import httplib

def respondError(status, msg=None):
    if msg is None:
      if status in httplib.responses:
        msg = httplib.responses[status]
      else:
        raise AppError("Unknown error status %s" % status)

    payload = jsonify(reason="%s %s" % (status, msg))
    return abort(make_response(payload, status))

class AppError(Exception):
  """Generic error class for app errors."""
  status_code = 500
  def __init__(self, message, status_code=None, payload=None):
    Exception.__init__(self)
    self.message = message
    if status_code is None:
      self.status_code = status_code
    if payload is None:
      self.payload = payload

  def to_dict(self):
    rv = dict(self.payload or ())
    rv['message'] = self.message
    return rv
