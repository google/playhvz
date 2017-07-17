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

# Make sure Jack starts out human
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Resistance Comms Hub']])

# Drake infects Jack
driver.SwitchUser("drake")
driver.DrawerMenuClick('mobile-main-page', 'My Profile')
driver.ExpectContains([[By.NAME, 'profilePoints']], '108')

driver.DrawerMenuClick('profile-card', 'Dashboard')
driver.SendKeys(
    [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
    'grobble-forgbobbly') # Crashed here once (desktop)

driver.Click([[By.ID, 'infect']])
driver.ExpectContains(
    [[By.NAME, 'victimName']],
    'JackSlayerTheBeanSlasher')

# Check that Jack is now in the zombie chat

driver.DrawerMenuClick('mobile-main-page', 'Horde ZedLink')
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-Horde ZedLink']])
driver.FindElement([
    [By.NAME, 'chat-card'], 
    [By.NAME, 'chat-drawer-Horde ZedLink'], 
    [By.NAME, 'JackSlayerTheBeanSlasher']], should_exist=True)

# Jack shows up as a zed on the leaderboard
driver.DrawerMenuClick('chat-card', 'Leaderboard')
driver.ExpectContains([[By.NAME, 'leaderboard-card'], [By.NAME,'Leaderboard Allegiance Cell JackSlayerTheBeanSlasher']], 'horde')

# Jack's alive status changes
driver.DrawerMenuClick('leaderboard-card', 'Global Chat')
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-Global Chat']])
driver.Click([
    [By.NAME, 'chat-card'], 
    [By.NAME, 'chat-drawer-Global Chat'], 
    [By.NAME, 'JackSlayerTheBeanSlasher']])
driver.ExpectContains([[By.NAME, 'status']], 'Living Dead')

# Check that Drake has been given points for the kill
driver.DrawerMenuClick('profile-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'profilePoints']], '208')

# See that Jack is now a zombie
driver.SwitchUser("jack")

driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Horde ZedLink']])
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Resistance Comms Hub']], should_exist=False)
driver.DrawerMenuClick('chat-card', 'Dashboard')
driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

# Check that Jack can't be infected again with the same code
driver.SwitchUser('drake')
driver.DrawerMenuClick('mobile-main-page', 'Infect')

# Try to infect Jack again - shouldn't work this time (since life code is already claimed)
driver.SendKeys([[By.NAME, 'infect-card'], [By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'grobble-forgbobbly')
driver.Click([[By.NAME, 'infect-card'], [By.ID, 'infect']])
driver.DismissAlert()

driver.Quit()
