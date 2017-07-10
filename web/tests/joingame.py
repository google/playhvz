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

driver.Click([[By.NAME, 'joinGame']])

driver.Click([[By.NAME, 'joinGameIntroNext']])

driver.SendKeys(
    [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
    'ReggieTheRavager')

driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])

# TODO(aliengirl): crashed here - maybe add RetryUntil?
driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])

driver.Click([[By.NAME, 'joinGameTakePhotos'], [By.NAME, 'option1']])

driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option0']])

driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option2']]) # comms
driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option4']]) # first aid
driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option5']]) # sorcery
driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option8']]) # chronicler
driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.TAG_NAME, 'paper-button']])

driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

#TODO(aliengirl): Figure out why it's failing here on mobile and stop that!
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

driver.DrawerMenuClick('leaderboard-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'player-name']], 'ReggieTheRavager')
driver.ExpectContains([[By.NAME, 'status']], 'Alive')
driver.ExpectContains([[By.NAME, 'profilePoints']], '0')
driver.ExpectContains([[By.NAME, 'notifications-sound']], "No")
driver.ExpectContains([[By.NAME, 'notifications-vibration']], "No")


driver.SwitchUser('zella')
driver.DrawerMenuClick('mobile-main-page', 'Admin Players')
driver.Click([[By.NAME, 'player-row-ReggieTheRavager'], [By.ID, 'name']])
driver.ExpectContains([[By.NAME, 'player-name']], "ReggieTheRavager")
driver.ExpectContains([[By.NAME, 'status']], 'Alive')
driver.ExpectContains([[By.NAME, 'profilePoints']], '0')
driver.ExpectContains([[By.NAME, 'notifications-sound']], "No")
driver.ExpectContains([[By.NAME, 'notifications-vibration']], "No")
driver.ExpectContains([[By.NAME, 'volunteered-for']], "Communications")
driver.ExpectContains([[By.NAME, 'volunteered-for']], "Communications")
driver.ExpectContains([[By.NAME, 'volunteered-for']], "Sorcerer")
driver.ExpectContains([[By.NAME, 'volunteered-for']], "Chronicler")
driver.ExpectContains([[By.NAME, 'active']], "Yes")
driver.ExpectContains([[By.NAME, 'can-infect']], "No")
driver.ExpectContains([[By.NAME, 'need-gun']], "No")
driver.ExpectContains([[By.NAME, 'starting-zombie']], "No")
driver.ExpectContains([[By.NAME, 'possessed-human']], "No")
driver.ExpectContains([[By.NAME, 'got-equipment']], "No")
# TODO(aliengirl): Add in other fields, and make sure they show up right.

driver.Quit()

