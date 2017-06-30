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

driver = setup.MakeDriver(user="reggie")

try:

  if not driver.is_mobile:
    driver.Click([[By.NAME, 'joinGame']])

  driver.SendKeys(
      [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
      'ReggieTheRavager')

  driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])

  # TODO(aliengirl): crashed here - maybe add RetryUntil?
  driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameTakePhotos'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option2']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option4']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option5']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option8']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.TAG_NAME, 'paper-button']])

  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

  driver.FindElement([[By.TAG_NAME, 'ghvz-rules']])

  driver.DrawerMenuClick('mobile-main-page', 'Chat')
  driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Global Chat')

  driver.DrawerMenuClick('chat-card', 'Leaderboard')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Name Cell ReggieTheRavager']],
      'ReggieTheRavager')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Allegiance Cell ReggieTheRavager']],
      'undeclared')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell ReggieTheRavager']],
      '0')

  driver.DrawerMenuClick('leaderboard-card', 'Dashboard')

  driver.SwitchUser('zella')

  # driver.SwitchUser("drake")

  # driver.Click([[By.NAME, 'drawerMy Profile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '100')

  # driver.Click([[By.NAME, 'drawerDashboard']])

  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # driver.Click([[By.ID, 'infect']])

  # driver.ExpectContains(
  #     [[By.ID, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # driver.Click([[By.NAME, 'drawerMy Profile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '200')

  # driver.SwitchUser("jack")

  # driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  # driver.FindElement([[By.NAME, 'Horde ZedLink']])
  
  # driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.Quit()

finally:
  # driver.Quit()
  pass
