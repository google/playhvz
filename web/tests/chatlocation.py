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
import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="moldavi")

if driver.is_mobile:
  # Moldavi shares his location
  driver.DrawerMenuClick('mobile-main-page', 'Global Chat')
  driver.Click([[By.TAG_NAME, 'ghvz-chat-location'], [By.TAG_NAME, 'paper-icon-button']])
  driver.RetryUntil(
    lambda : True,
    lambda: driver.FindElement([[By.NAME, 'map-ready']]))
  driver.Click([[By.ID, 'sendLocationForm'], [By.ID, 'done']])
  # NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
  location = driver.FindElement([[By.NAME, 'message-Global Chat-'], [By.ID, 'mapContainer']])
  location = location.get_attribute('src')
  assert "https://maps.googleapis.com/maps/api/staticmap" in location;

  # Jack can see it
  driver.SwitchUser('jack')
  driver.DrawerMenuClick('mobile-main-page', 'Global Chat')
  # NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
  location = driver.FindElement([[By.NAME, 'message-Global Chat-'], [By.ID, 'mapContainer']])
  location = location.get_attribute('src')
  assert "https://maps.googleapis.com/maps/api/staticmap" in location;

driver.Quit()
