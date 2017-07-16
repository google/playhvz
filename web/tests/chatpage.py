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

def getPathToElement(playerName, tag, name):
  xpathForPageElement = "//*[contains(@id, 'chat-page-%s')]//%s[contains(@name, '%s')]"
  return xpathForPageElement % (playerName, tag, name)

def closeNotifications(driver):
  driver.Click([[By.NAME, 'close-notification']])

def toggleChatDrawer(driver, actingPlayer, chatRoomName):
  xpathChatDrawerButton = getPathToElement(actingPlayer, 'paper-icon-button', 'chat-info-' + chatRoomName)
  driver.Click([[By.XPATH, xpathChatDrawerButton]])  

# Start Test
actingPlayer = 'zeke' # non-admin human
actingPlayerName = playerNames[actingPlayer]
newChatName = 'No hoomans allowed'
driver = setup.MakeDriver()

driver.WaitForGameLoaded()

# Open dialog for creating new chat room
driver.SwitchUser(actingPlayer)
driver.DrawerMenuClick('mobile-main-page', 'New chat')

# Set chat room settings to be zombie only
driver.FindElement([[By.ID, 'chatName']])
driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], newChatName)
driver.Click([[By.ID, 'allegianceFilter']])
driver.Click([[By.ID, 'settingsForm'], [By.ID, 'done']])

# Check the newly created chat room is opened
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chat-room-%s' % newChatName]])

# Add a zombie to chat
toggleChatDrawer(driver, actingPlayerName, newChatName)
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.Click([[By.XPATH, xpathAdd]])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], playerNames['drake'])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], Keys.RETURN)

# Check drawer to see that zombie was added
driver.FindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['drake']]])

# Make sure human can't be added to chat
driver.Click([[By.XPATH, xpathAdd]])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], playerNames['jack'])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], Keys.RETURN)
driver.DismissAlert()
driver.DontFindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['jack']]])

# Close chat drawer before typing a message
toggleChatDrawer(driver, actingPlayerName, newChatName)

# Message the chat 
xpathTextarea = getPathToElement(actingPlayerName, 'textarea', 'input-' + newChatName)
xpathSend = getPathToElement(actingPlayerName, 'paper-button', 'submit-' + newChatName)
driver.SendKeys([[By.NAME, 'input-%s' % newChatName], [By.XPATH, xpathTextarea]], 'Whats our plan?')
driver.Click([[By.NAME, 'submit-%s' % newChatName], [By.XPATH, xpathSend]])

# Check that other player can see the message
driver.SwitchUser('drake')
driver.DrawerMenuClick('mobile-main-page', newChatName)
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, 'message-%s-Whats our plan?' % newChatName], [By.CLASS_NAME, 'message-bubble']], 
'Whats our plan?')

# Switch back to original player
driver.SwitchUser(actingPlayer)
driver.DrawerMenuClick('chat-card', newChatName)
toggleChatDrawer(driver, actingPlayerName, newChatName)

# Kick player from chat
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.ID, 'kick-' + playerNames['drake']]])
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.ID, 'kickForm'], [By.ID, 'done']])

# Confirm player was kicked
driver.DontFindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['drake']]])

# Leave the chat
xpathLeaveButton = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeaveButton]])
driver.Click([[By.XPATH, xpathLeaveButton]])

xpathLeaveDialog = getPathToElement(actingPlayerName, '*', 'chat-leave-dialog-' + newChatName)
driver.FindElement([[By.XPATH, xpathLeaveDialog]])
driver.Click([[By.XPATH, xpathLeaveDialog], [By.ID, 'done']])
# TODO(aliengirl): find out why this fails on mobile
# driver.DontFindElement([[By.XPATH, xpathLeaveDialog]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, newChatName]])
      
driver.Quit()
