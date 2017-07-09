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

driver = setup.MakeDriver(user="zella")

driver.Click([[By.NAME, 'close-notification']])

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

# Open game details
driver.DrawerMenuClick('rules-card', 'Admin Game Details')

# Open up Game details, change each field
driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
driver.SendKeys([[By.ID, 'form-section-game-name'], [By.ID, 'input']], 'A Quick and Certain Death to Humanity')
driver.SendKeys([[By.ID, 'form-section-game-stunTimer'], [By.TAG_NAME, 'input']], 100)

# If you click Cancel, the new changes shouldn't show up.
driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'cancel']])
driver.ExpectContains([[By.NAME, 'game-name']], 'A Quick and Certain Death to Humanity', False)
driver.ExpectContains([[By.NAME, 'game-stunTimer']], "100", False)

# # Open up Game details, change all the fields again.
driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
driver.SendKeys([[By.ID, 'form-section-game-name'], [By.ID, 'input']], 'Welcome to the Zombies-Have-Hunger Games')
driver.SendKeys([[By.ID, 'form-section-game-stunTimer'], [By.TAG_NAME, 'input']], 42)

# # If you click Save, the new stun timer should show up.
driver.Click([[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'gameForm'],[By.ID, 'done']])
driver.ExpectContains([[By.NAME, 'game-name']], 'Welcome to the Zombies-Have-Hunger Games')
driver.ExpectContains([[By.NAME, 'game-stunTimer']], "42")

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

driver.Quit()

