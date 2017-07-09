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

# Sign in as a normal human.
driver = setup.MakeDriver(user="jack")

# See that they have no infect icon on the home page
driver.FindElement([[By.NAME, 'infect-box']], should_exist=False)

# See the resistance chat
driver.DrawerMenuClick('mobile-main-page', 'Resistance Comms Hub')

# Normal human tries to infect people
driver.DrawerMenuClick('chat-card', 'Infect')
# Invalid input - throws error alert
driver.SendKeys([[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'not a lifecode')
driver.Click([[By.ID, 'infect']])
driver.DismissAlert()
# Other player's life code - throws error alert
driver.SendKeys([[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'zooble flipwoogly') # Moldavi's code
driver.Click([[By.ID, 'infect']])
driver.DismissAlert()

# Sign in as Zella (also a human)
driver.SwitchUser('zella')

# Make Zella a possessed human
driver.DrawerMenuClick('mobile-main-page', 'My Profile')
driver.Click([[By.ID, 'set-infect-button']])
driver.ExpectContains([[By.NAME, 'can-infect']], 'Yes')

# Check that Zella is still in the human chat
driver.DrawerMenuClick('profile-card', '-Resistance Comms Hub')

# Zella infects Moldavi
driver.DrawerMenuClick('mobile-main-page', 'Infect')
driver.SendKeys([[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'zooble flipwoogly') # Moldavi's code
driver.Click([[By.ID, 'infect']])
driver.ExpectContains([[By.NAME, 'infect-card'], [By.NAME, 'victimName']],'MoldaviTheMoldavish')

# Zella is now a zombie
driver.DrawerMenuClick('infect-card', 'Dashboard')
driver.FindElement([[By.NAME, 'infect-box']])
driver.DrawerMenuClick('mobile-main-page', '-Horde ZedLink')
driver.DrawerMenuClick('chat-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'status']], 'Living Dead')
driver.ExpectContains([[By.NAME, 'profilePoints']], '100') # Points from infecting Moldavi
driver.FindElement([[By.NAME, 'infection-line']])

# Check that Moldavi is now a possessed human
driver.DrawerMenuClick('profile-card', 'Admin Players')
driver.Click([[By.NAME, 'player-row-MoldaviTheMoldavish'], [By.ID, 'name']])
driver.ExpectContains([[By.NAME, 'can-infect']], 'Yes')
driver.ExpectContains([[By.NAME, 'status']], 'Alive')

# Moldavi now can secret-zombie infects Jack
driver.SwitchUser('moldavi')
driver.DrawerMenuClick('profile-card', '-Resistance Comms Hub')
driver.DrawerMenuClick('mobile-main-page', 'Infect')
driver.SendKeys([[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'grobble forgbobbly') # Jack's code
driver.Click([[By.ID, 'infect']])
driver.ExpectContains([[By.NAME, 'infect-card'], [By.NAME, 'victimName']],'JackSlayerTheBeanSlasher')

# Moldavi is now a zombie
driver.DrawerMenuClick('infect-card', 'Dashboard')
driver.FindElement([[By.NAME, 'infect-box']])
driver.DrawerMenuClick('mobile-main-page', '-Horde ZedLink')
driver.DrawerMenuClick('chat-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'status']], 'Living Dead')
driver.ExpectContains([[By.NAME, 'profilePoints']], '100') # Points from infecting Jack
driver.FindElement([[By.NAME, 'infection-line']])

# Jack is still human
driver.SwitchUser('jack')
driver.DrawerMenuClick('mobile-main-page', '-Resistance Comms Hub')

driver.Quit()

