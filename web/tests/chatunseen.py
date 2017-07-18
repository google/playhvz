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

""" Tests for the chat unseen message badge. """

import sys
import pdb


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
import setup
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Test Setup
playerNames = {
        'zella': 'ZellaTheUltimate',
        'deckerd': 'DeckerdTheHesitant',
        'moldavi': 'MoldaviTheMoldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'JackSlayerTheBeanSlasher'
      }

xpathToUnseen = "//*[contains(@id, 'drawerChatItem-%s')]//div[contains(@name, 'unseenIcon')]";

# Start Test
actingPlayer = 'zella' # admin human
actingPlayerName = playerNames[actingPlayer]
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

# Open the drawer if we need to
if driver.is_mobile:
  driver.Click([[By.CLASS_NAME, 'visible-page'], [By.CLASS_NAME, 'header'], [By.NAME, 'drawerButton']]),

# Empty chat shouldn't have an unseen badge
driver.DontFindElement([[By.XPATH, xpathToUnseen % 'Global Chat']])

# Chats with messages should have an unseen badge
driver.FindElement([[By.XPATH, xpathToUnseen % 'Resistance Comms Hub']])
driver.FindElement([[By.XPATH, xpathToUnseen % 'My Chat Room!']])

# Only desktop has chats on the dashboard
if not driver.is_mobile:
  # Clicking on the chat room on the dashboard should count as seeing the message
  driver.Click([[By.NAME, 'conversationContainer: My Chat Room!']])
  driver.DontFindElement([[By.XPATH, xpathToUnseen % 'My Chat Room!']])

# Opening the chat room should count as seeing the message 
# (since it's already scrolled to the bottom)
driver.Click([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Resistance Comms Hub']])
driver.DontFindElement([[By.XPATH, xpathToUnseen % 'Resistance Comms Hub']])

driver.Quit()