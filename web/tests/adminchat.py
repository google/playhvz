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

## Test setup
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



## Run admin chat test
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

actingPlayer = 'zeke'
actingPlayerName = playerNames[actingPlayer]
chatName = actingPlayerName + ' & HvZ CDC'

# Switch to right user and open chat page
driver.SwitchUser(actingPlayer)

# Create chat with admin
driver.FindElement([[By.NAME, 'create-admin-chat-button']])
driver.RetryUntil(
  lambda: driver.Click([[By.NAME, 'create-admin-chat-button']]),
  lambda: driver.FindElement([[By.NAME, "chat-room-%s" % chatName]])
)

# TODO(aliengirl): make this line work consistently on mobile
# driver.FindElement([[By.NAME, "chat-room-%s" % chatName]]) 
# driver.DontFindElement([[By.NAME, 'create-admin-chat-button']])

# Type a message into the chat
xpathTextarea = getPathToElement(actingPlayerName, 'textarea', 'input-' + chatName)
xpathSend = getPathToElement(actingPlayerName, 'paper-button', 'submit-' + chatName)

driver.FindElement([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]]) 
driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]], 
  'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
driver.Click([[By.NAME, 'submit-%s' % chatName], [By.XPATH, xpathSend]])

def CheckAdminSeesMessage(admin, chatName):
  driver.SwitchUser(admin)
  closeNotifications(driver)
  driver.DrawerMenuClick('mobile-main-page', 'Admin Chats')
  driver.Click([[By.TAG_NAME, 'ghvz-admin-chat-page'], [By.NAME, 'drawer' + chatName]])  
  driver.ExpectContains([
      [By.TAG_NAME, 'ghvz-admin-chat-page'],
      [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
      [By.CLASS_NAME, 'message-bubble']], 
      'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
# Check that every admin sees the chat and message
CheckAdminSeesMessage('zella', chatName)
CheckAdminSeesMessage('moldavi', chatName)

# Non-Admin should leave admin chat
driver.SwitchUser(actingPlayer)
driver.DrawerMenuClick('mobile-main-page', chatName)

driver.Click([[By.TAG_NAME, 'ghvz-drawer'], [By.NAME, 'drawer' + chatName]])
driver.Click([[By.TAG_NAME, 'ghvz-display-page'], [By.NAME, 'chat-card'], [By.NAME, 'chat-info-' + chatName]])
xpathChatDrawer = getPathToElement(actingPlayerName, 'div', 'chat-drawer-%s' % chatName)
driver.FindElement([[By.XPATH, xpathChatDrawer]])  

xpathLeaveButton = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeaveButton]])
driver.Click([[By.XPATH, xpathLeaveButton]])

  # TODO: make leave button work the same way on mobile as it does on web
  # Chat should be hidden, verify chat with admin button is available after leaving admin chat
driver.FindElement([[By.NAME, 'create-admin-chat-button']])

# Reopen admin chat
driver.Click([[By.NAME, 'create-admin-chat-button']]) 

# Verify original message is still in chat room
driver.ExpectContains([
  [By.NAME, 'chat-card'], 
  [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
  [By.CLASS_NAME, 'message-bubble']], 
  'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

# Player opens drawer and hides chat room
xpathChatDrawerButton = getPathToElement(actingPlayerName, 'paper-icon-button', 'chat-info-' + chatName)
driver.Click([[By.XPATH, xpathChatDrawerButton]])  
xpathChatDrawer = getPathToElement(actingPlayerName, 'div', 'chat-drawer-%s' % chatName)
driver.FindElement([[By.XPATH, xpathChatDrawer]])  
xpathLeaveButton = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeaveButton]])
driver.Click([[By.XPATH, xpathLeaveButton]])

driver.DontFindElement([
  [By.NAME, 'chat-card'], 
  [By.NAME, 'ChatRoom: Zeke & HvZ CDC']])

# Admin messages chat after player left
actingPlayer = 'moldavi'
driver.SwitchUser(actingPlayer)

driver.DrawerMenuClick('mobile-main-page', chatName)

actingPlayerName = playerNames[actingPlayer]
xpathTextarea = getPathToElement(actingPlayerName, 'textarea', 'input-' + chatName)
xpathSend = getPathToElement(actingPlayerName, 'paper-button', 'submit-' + chatName)
driver.FindElement([[By.XPATH, xpathTextarea]]) 
driver.SendKeys([[By.XPATH, xpathTextarea]], 
  'Mere player, did you just leave the chat room!?')
driver.Click([[By.XPATH, xpathSend]])

# Make sure admin chat is visible again since there was a new message
actingPlayer = 'zeke'
driver.SwitchUser(actingPlayer)

driver.DrawerMenuClick('mobile-main-page', chatName)
driver.FindElement([
  [By.NAME, 'chat-card'], 
  [By.NAME, 'ChatRoom: Zeke & HvZ CDC']])

driver.Quit()
