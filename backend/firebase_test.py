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

import unittest


class FooTest(unittest.TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def testBar(self):
        pass


if __name__ == '__main__':
    unittest.main()
import logging
import time
import random

from firebase import firebase

HTTP_REQUEST = google.auth.transport.requests.Request()

# TODO(chewys): Figure out how to make this log in with an email and password
auth = firebase.FirebaseAuthentication(
    config.FIREBASE_SECRET, config.FIREBASE_EMAIL, admin=True)
db = firebase.FirebaseApplication(
    config.FIREBASE_CONFIG['databaseURL'], authentication=auth)
