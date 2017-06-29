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
