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
import time

def main(argv):
    pass

def countingDown(shouldCount, maxTime=False, checkGreater=False):
	# Sketchy sketchy ... I should come back and improve this at some point
	oldTime = int(driver.FindElement([[By.NAME, 'time-counter']], check_visible=False).get_attribute("time"))
	time.sleep(2.1)
	newTime = int(driver.FindElement([[By.NAME, 'time-counter']], check_visible=False).get_attribute("time"))
	if shouldCount:	
		# The -1 is and the abs. value is b/c sometimes the timer ticks down one more time after you've pressed stop.
		assert newTime < oldTime - 1, "%d is not less than %d" % (newTime, oldTime)
	else:
		assert abs(oldTime - newTime) <= 1, "%d is not equal to %d" % (newTime, oldTime)
	if maxTime:
		if checkGreater:
			assert oldTime >= maxTime, "%d is not greater than or equal to %d" % (oldTime, maxTime)
		else:
			assert newTime < maxTime, "%d is not less than %d" % (newTime, maxTime)
	return newTime


if __name__ == '__main__':
    main(sys.argv)
import setup
from selenium.webdriver.common.by import By

INTITIAL_TIMER = 60

driver = setup.MakeDriver(user="zeke")


if driver.is_mobile:
	driver.FindElement([[By.NAME, 'stuntimer-box']])

driver.DrawerMenuClick('mobile-main-page', 'Stun Timer')

# Check that the timer actually counts down when you press start/stop
driver.ExpectAttributeEqual([[By.NAME, 'timer-startstop']], "innerText", "START")
driver.Click([[By.NAME, 'timer-startstop']])
driver.ExpectAttributeEqual([[By.NAME, 'timer-startstop']], "innerText", "STOP")
time.sleep(2)
currTime = countingDown(True, INTITIAL_TIMER)

# Zeke stops and restarts timer
driver.Click([[By.NAME, 'timer-startstop']])
currTime = countingDown(False, currTime)
driver.Click([[By.NAME, 'timer-startstop']])
currTime = countingDown(True, currTime)

# Zeke resets timer
driver.Click([[By.NAME, 'timer-reset']])
currTime = countingDown(True, currTime, True)

# Zeke stops timer, then resets it (then restarts it)
driver.Click([[By.NAME, 'timer-startstop']])
currTime = countingDown(False, currTime)
driver.Click([[By.NAME, 'timer-reset']])
currTime = countingDown(False, INTITIAL_TIMER, True)
driver.Click([[By.NAME, 'timer-startstop']])
currTime = countingDown(True, currTime)

# Zeke tries infecting a human while his timer is going (shouldn't interrupt timer)
driver.DrawerMenuClick('stuntimer-card', 'Infect')
driver.SendKeys(
    [[By.NAME, 'infect-card'], [By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
    'grobble forgbobbly') # Crashed here once (desktop)
driver.Click([[By.NAME, 'infect-card'], [By.ID, 'infect']])
driver.ExpectContains(
    [[By.NAME, 'infect-card'], [By.NAME, 'victimName']],
    'JackSlayerTheBeanSlasher')

driver.DrawerMenuClick('infect-card', 'Stun Timer')
currTime = countingDown(True, currTime)

# Zella (an admin) changes the stun timer
driver.SwitchUser('zella')
driver.Click([[By.NAME, 'close-notification']])
driver.DrawerMenuClick('rules-card', 'Admin Game Details')
driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
driver.SendKeys([[By.ID, 'form-section-game-stunTimer'], [By.TAG_NAME, 'input']], 3)
driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])

# Zeke resets the stun timer and checks that it counts down to 0
driver.SwitchUser('zeke')
driver.Click([[By.NAME, 'timer-reset']])
time.sleep(3.1)
countingDown(False, 0, True)
driver.FindElement([[By.NAME, 'times-up']])

# Zeke resets the timer, restarts it again
driver.Click([[By.NAME, 'timer-reset']])
driver.Click([[By.NAME, 'timer-startstop']])
countingDown(True, 3)

# Check that all registered types members can also see the stun timer in their drawer
driver.SwitchUser('zella') # human
driver.DrawerMenuClick('mobile-main-page', 'Stun Timer')
driver.FindElement([[By.NAME, 'timer-startstop']])

driver.SwitchUser('deckerd') # undeclared
driver.DrawerMenuClick('mobile-main-page', 'Stun Timer')
driver.FindElement([[By.NAME, 'timer-startstop']])

driver.Quit()
