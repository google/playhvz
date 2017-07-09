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

# It's a dark and lonely night. The rash young human Jack is walking alone, unguarded, when
# the sly zombie Zeke leaps from a bush and tears out his brain!

# Jack self-infects
driver.DrawerMenuClick('mobile-main-page', 'Infect')
driver.SendKeys([[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'grobble forgbobbly') # Jack's code
driver.Click([[By.ID, 'infect']])
driver.ExpectContains([[By.NAME, 'infect-card'], [By.ID, 'selfInfectedMessage']], 'Welcome to the horde!')

# TODO(aliengirl): Do we want/need an "are you sure" popup?

# Check Jack is now a zombie (infect widget, profile)
driver.DrawerMenuClick('infect-card', 'Dashboard')
driver.FindElement([[By.NAME, 'infect-box']])
driver.DrawerMenuClick('mobile-main-page', '-Horde ZedLink')
driver.DrawerMenuClick('chat-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'status']], 'Living Dead')
driver.ExpectContains([[By.NAME, 'profilePoints']], '0') # Self-infecting doesn't give you points
driver.FindElement([[By.NAME, 'infection-line-0']])
driver.FindElement([[By.NAME, 'infection-line-1']], should_exist=False) # Exactly 1 infection

# Zeke records the kill
driver.SwitchUser('zeke')
driver.DrawerMenuClick('mobile-main-page', 'Infect')
driver.SendKeys([[By.NAME, 'infect-card'], [By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'grobble forgbobbly') # Jack's code
driver.Click([[By.NAME, 'infect-card'], [By.ID, 'infect']])
driver.ExpectContains([[By.NAME, 'infect-card'], [By.NAME, 'victimName']],'JackSlayerTheBeanSlasher')
driver.Click([[By.NAME, 'infect-card'], [By.ID, 'done']])

# Try to infect Jack again - shouldn't work this time (since life code is already claimed)
driver.SendKeys([[By.NAME, 'infect-card'], [By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']], 'grobble forgbobbly')
driver.Click([[By.NAME, 'infect-card'], [By.ID, 'infect']])
driver.DismissAlert()

# Check that Zeke got points
driver.DrawerMenuClick('infect-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'profilePoints']], '100')

# Check that Jack only has 1 infection on his profile
driver.SwitchUser('jack')
driver.FindElement([[By.NAME, 'infection-line-0']])
driver.FindElement([[By.NAME, 'infection-line-1']], should_exist=False) # Exactly 1 infection

driver.Quit()


