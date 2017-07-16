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
from selenium.webdriver.remote.webelement import WebElement

driver = setup.MakeDriver(user="zella")

driver.Click([[By.NAME, 'close-notification']])

driver.ExpectContains(
    [[By.NAME, 'game-summary-box']],
    '60') # current stun timer

# Go to the Rules page, change the rules
driver.DrawerMenuClick('mobile-main-page', 'Rules')
driver.Click([[By.NAME, 'rules-card'], [By.NAME, 'rules-icon']]) # Flaked once on remote, another icon would have received click -verdagon
driver.SendKeys(
    [[By.NAME, 'rules-card'], [By.TAG_NAME, 'textarea']], 'rules are cools')

# If you click Cancel, the new words shouldn't show up.
driver.Click([[By.NAME, 'rules-card'],[By.ID, 'cancel']])
driver.ExpectContains(
    [[By.NAME, 'rules-card'], [By.ID, 'rulesForm']],
    'rules are cools', False)

# Open up rules, type something different.
driver.Click([[By.NAME, 'rules-card'], [By.NAME, 'rules-icon']])  # TODO(aliengirl): once failed here -m; said the "r u human" popup was blocking
driver.SendKeys(
    [[By.NAME, 'rules-card'], [By.TAG_NAME, 'textarea']],
    'rules are cools when you save them')

# If you click Save, the new words should show up.
driver.Click([[By.NAME, 'rules-card'],[By.ID, 'done']])
driver.ExpectContains(
    [[By.NAME, 'rules-card'], [By.ID, 'rules']],
    'rules are cools when you save them')

driver.FindElement([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-text-Details']], should_exist=False)
driver.Click([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-Details']])
driver.FindElement([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-text-Details']], should_exist=True)
##### driver.ExpectContains([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-text-Details']])
driver.Click([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-Details']])
driver.FindElement([[By.NAME, 'rules-card'], [By.NAME, 'collapsible-text-Details']], should_exist=False)

# Open game details
driver.DrawerMenuClick('rules-card', 'Admin Game Details')
driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])

driver.Clear([[By.ID, 'form-section-game-name'], [By.ID, 'input']])
driver.SendKeys([[By.ID, 'form-section-game-name'], [By.ID, 'input']], 'Welcome to the Zombies-Have-Hunger Games')
driver.SendKeys([[By.ID, 'form-section-game-stunTimer'], [By.TAG_NAME, 'input']], 42)
driver.SendKeys([[By.ID, 'form-section-game-infectPoints'], [By.TAG_NAME, 'input']], 404)

# Set game start time to sometime in the past
driver.Clear([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")
driver.Clear([[By.ID, 'form-section-start-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']], "1")
driver.Clear([[By.ID, 'form-section-start-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']], "1")
driver.Clear([[By.ID, 'form-section-start-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']], "1:00am")

# Set game end time 
driver.Clear([[By.ID, 'form-section-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2017")
driver.Clear([[By.ID, 'form-section-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']], "12")
driver.Clear([[By.ID, 'form-section-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']], "31")
driver.Clear([[By.ID, 'form-section-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']], "12:00am")

# Set the declare resistance and declare horde end times to sometime in the past
driver.Clear([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")
driver.Clear([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']], "2")
driver.Clear([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']], "29")
driver.Clear([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']], "4:15am")

driver.Clear([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")
driver.Clear([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'month'],[By.TAG_NAME, 'input']], "10")
driver.Clear([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'day'],[By.TAG_NAME, 'input']], "12")
driver.Clear([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'time'],[By.TAG_NAME, 'input']], "12:34pm")

# If you click Save, the new data should show up.
driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])
driver.ExpectContains([[By.NAME, 'game-name']], 'Welcome to the Zombies-Have-Hunger Games')
driver.ExpectContains([[By.NAME, 'game-stunTimer']], "42")
driver.ExpectContains([[By.NAME, 'game-infectPoints']], "404")
driver.ExpectContains([[By.NAME, 'game-startTime']], "Jan 1 1:00am")
driver.ExpectContains([[By.NAME, 'game-endTime']], "Dec 31 12:00am")
driver.ExpectContains([[By.NAME, 'game-declareResistanceEndTime']], "Feb 29 4:15am")
driver.ExpectContains([[By.NAME, 'game-declareHordeEndTime']], "Oct 12 12:34pm")

# Check that zombies get the new number of points
driver.SwitchUser('zeke')
driver.DrawerMenuClick('mobile-main-page', 'Infect')
driver.SendKeys([[By.NAME, 'infect-card'], [By.TAG_NAME, 'input']], 'grobble-forgbobbly') # Jack's code
driver.Click([ [By.NAME, 'infect-card'], [By.ID, 'infect']])
driver.ExpectContains(
    [[By.NAME, 'infect-card'], [By.NAME, 'victimName']],
    'JackSlayerTheBeanSlasher')
driver.DrawerMenuClick('infect-card', 'Leaderboard')


# Have Deckerd try to declare and fail
driver.SwitchUser('deckerd')
driver.Click([[By.NAME, 'declareAllegiance']])
driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']], 'aria-disabled', "true")
driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option1']], 'aria-disabled', "true")


#NOTE: commented out b/c declare button doesn't update in real time
# TODO(aliengirl): Uncomment these lines once the declare buttons update in realtime

# # Go back, change resistance cutoff time to future
# driver.SwitchUser('zella')
# driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
# driver.Clear([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
# driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2020")
# driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])

# # Deckerd could declare resistance now
# driver.SwitchUser('deckerd')
# driver.Click([[By.NAME, 'declareAllegiance']])
# driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']], 'aria-disabled', "false")
# driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option1']], 'aria-disabled', "true")

# # change the horde cutoff time to the future too
# driver.SwitchUser('zella')
# driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
# driver.Clear([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
# driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2018")
# driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])

# # Deckerd can now declare either
# driver.SwitchUser('deckerd')
# driver.Click([[By.NAME, 'declareAllegiance']])
# driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']], 'aria-disabled', "false")
# driver.ExpectAttributeEqual([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option1']], 'aria-disabled', "false")

# Zella sets the registration cutoff to be in the past
driver.SwitchUser('zella')
driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
driver.Clear([[By.ID, 'form-section-reg-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']])
driver.SendKeys([[By.ID, 'form-section-reg-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")
driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])
driver.ExpectContains([[By.NAME, 'game-registrationEndTime']], "Jan 1 8:00am")

# NOTE: As far as I can tell, the registration cutoff time does absolutely nothing

# TODO(aliengirl): Once the reg. cutoff actually blocks registration, have a test where Minny tries to join game, but can't


# Go to the FAQ page
driver.DrawerMenuClick('game-details-card', 'FAQ')

driver.Click([[By.NAME, 'faq-card'], [By.NAME, 'rules-icon']])
driver.SendKeys(
    [[By.NAME, 'faq-card'], [By.TAG_NAME, 'textarea']], 
    'Here is how you find a possessed human.')

# If you click Save, the new words should show up.
driver.Click([[By.NAME, 'faq-card'],[By.ID, 'done']])

driver.ExpectContains(
    [[By.NAME, 'faq-card'], [By.ID, 'contents']],
    'Here is how you find a possessed human.')

# Go to the Admin Game Summary page
driver.DrawerMenuClick('faq-card', 'Admin Game Summary')
driver.Click([[By.NAME, 'summary-card'], [By.NAME, 'rules-icon']])
driver.Clear([[By.NAME, 'summary-card'], [By.ID, 'summaryHtmlInput'], [By.TAG_NAME, 'textarea']])
driver.SendKeys(
    [[By.NAME, 'summary-card'], [By.TAG_NAME, 'textarea']], 
    "<div>During yesterday's mission, the humans decided the best defense was a good offense and ran around trying to bite zombies.</div>")
driver.Click([[By.NAME, 'summary-card'],[By.ID, 'done']])
driver.ExpectContains(
    [[By.NAME, 'summary-card'], [By.ID, 'summary']],
    "During yesterday's mission, the humans decided the best defense was a good offense and ran around trying to bite zombies.")
driver.ExpectContains(
    [[By.NAME, 'summary-card'], [By.NAME, 'game-summary-box']],
    '42') # current stun timer

driver.Quit()

