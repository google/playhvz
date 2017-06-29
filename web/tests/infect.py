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

driver = setup.MakeDriver(user="jack")

try:

  # Make sure Jack starts out human
  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerChat']])

  driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Resistance Comms Hub')

  # Drake infects Jack
  driver.SwitchUser("drake")

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'profile-card'], [By.NAME, 'drawerButton']])
  
  driver.Click([[By.NAME, 'drawerDashboard']]) # Crashed here once (mobile)

  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly') # Crashed here once (desktop)

  driver.Click([[By.ID, 'infect']])

  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'JackSlayerTheBeanSlasher')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  # Check that Drake has been given points for the kill
  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '202')

  # See that Jack is now a zombie
  driver.SwitchUser("jack")

  driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Horde ZedLink')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerDashboard']])


  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])


  #driver.Quit()

finally:
  # driver.Quit()
  pass
