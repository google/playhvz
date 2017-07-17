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

# Test Setup
playerNames = {
        'zella': 'ZellaTheUltimate',
        'deckerd': 'DeckerdTheHesitant',
        'moldavi': 'MoldaviTheMoldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'JackSlayerTheBeanSlasher'
      }

adminPlayers = ['zella', 'moldavi']
nonAdminPlayers = ['deckerd', 'drake', 'zeke', 'jack']

def getPathToElement(playerName, tag, name):
  xpathForPageElement = "//*[contains(@id, 'chat-page-%s')]//%s[contains(@name, '%s')]"
  return xpathForPageElement % (playerName, tag, name)

def closeNotifications(driver):
  driver.Click([[By.NAME, 'close-notification']])

def openChatDrawer(driver, actingPlayer, chatRoomName):
  xpathChatDrawerButton = getPathToElement(actingPlayer, 'paper-icon-button', 'chat-info-' + chatRoomName)
  driver.Click([[By.XPATH, xpathChatDrawerButton]])  


# Start Test
actingPlayer = 'zeke' # non-admin zombie
actingPlayerName = playerNames[actingPlayer]
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

# Open chat page
driver.SwitchUser(actingPlayer)

# Check zombie player is in global chat, 2 zombie chats, and no human-only chats
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Global Chat']])
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Horde ZedLink']])
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Zeds Internal Secret Police']])
driver.FindElement([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Resistance Comms Hub']], should_exist=False)

# Open Global Chat
driver.Click([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer%s' % 'Global Chat']])

# Open chat drawer
openChatDrawer(driver, actingPlayerName, 'Global Chat')

# Check non-admin can't add players
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.DontFindElement([[By.XPATH, xpathAdd]])

# Check non-admin can't leave chat
xpathLeave = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.DontFindElement([[By.XPATH, xpathLeave]])

## Check 6 players are in global chat and non-admin can't kick players
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zella']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zella']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['drake']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zeke']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zeke']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['jack']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['jack']], [By.ID, 'trigger']])

## Test admins can add, leave, and kick from global chat
actingPlayer = 'zella' # admin human
actingPlayerName = playerNames[actingPlayer]

# Switch to chat page and open drawer
driver.SwitchUser(actingPlayer)
closeNotifications(driver)
driver.DrawerMenuClick('Global Chat')
openChatDrawer(driver, actingPlayerName, 'Global Chat')

# Check admin can add players
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.FindElement([[By.XPATH, xpathAdd]])

# Check admin can leave chat
xpathLeave = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeave]])

# Check admin can kick all 6 players
driver.DontFindElement([[By.NAME, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zella']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zeke']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['jack']], [By.ID, 'trigger']])

# Make sure you can click through drawer to people's profiles
driver.Click([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']]])
driver.ExpectContains([[By.NAME, 'profile-card'], [By.NAME, 'player-name']], 'DeckerdTheHesitant')
driver.DrawerMenuClick('Global Chat')
driver.Click([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']]])
driver.ExpectContains([[By.NAME, 'profile-card'], [By.NAME, 'player-name']], 'MoldaviTheMoldavish')


driver.Quit()
