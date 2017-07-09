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

driver = setup.MakeDriver(user="zella", page="/createGame", populate=False)

try:

  # Create game
  driver.Click([[By.ID, 'createGame']])
  driver.SendKeys(
    [[By.ID, 'idInput'], [By.TAG_NAME, 'input']], driver.GetGameId())
  driver.SendKeys(
    [[By.ID, 'nameInput'], [By.TAG_NAME, 'input']], 'My Game')
  driver.SendKeys(
    [[By.ID, 'stunTimerInput'], [By.TAG_NAME, 'input']], '60')
  # Set game start time to sometime in the past
  driver.Backspace([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")

  # Set the declare resistance and declare horde end times to sometime in the future
  driver.Backspace([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2018")

  driver.Backspace([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2018")

  driver.Click([[By.ID, 'gameForm'], [By.ID, 'done']])
  
  driver.WaitForGameLoaded()

  # Have a player join the game
  driver.SwitchUser("reggie")

  driver.Click([[By.NAME, 'joinGame']])
  driver.SendKeys(
      [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
      'ReggieTheRavager')
  driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])
  driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'joinGameTakePhotos'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option2']])
  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

  # Check that the leaderboard has the person show up with 0 points
  driver.DrawerMenuClick('mobile-main-page', 'Leaderboard')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Name Cell ReggieTheRavager']], 'ReggieTheRavager')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Allegiance Cell ReggieTheRavager']], 'undeclared')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell ReggieTheRavager']], '0')
  
  # Declare allegiance as a human
  driver.DrawerMenuClick('leaderboard-card', 'Dashboard')
  driver.Click([[By.NAME, 'declareAllegiance']])
  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']])
  driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'startQuizPage'], [By.NAME, 'offWeGo']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

  # Player sees their lifecode and allegiance
  driver.DrawerMenuClick('mobile-main-page', 'My Profile')
  driver.ExpectContains([[By.NAME, 'status']], 'Alive')
  driver.ExpectContains([[By.NAME, 'lifecode']], 'person-sandy-swift' if driver.use_remote else 'codefor-ReggieTheRavager')

  driver.Quit()

finally:
  pass
