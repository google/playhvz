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
import sys
from driver import WholeDriver

import setup
driver = setup.MakeDriver(user="zella")

try:
#  driver.Click([[By.NAME, 'close-notification']])
  driver.DrawerMenuClick('mobile-main-page', 'Sign Out')

  # Switch to signout alert & accept
  driver.DismissAlert('Signed out!')

  # Locally we're not really signed out. This should be tested on the server.  

  driver.Quit()

finally:
  pass

