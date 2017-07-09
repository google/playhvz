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

driver = setup.MakeDriver()
driver.WaitForGameLoaded()

playerNames = {
      'zella': 'ZellaTheUltimate',
      'deckerd': 'DeckerdTheHesitant',
      'moldavi': 'MoldaviTheMoldavish',
      'drake': 'Drackan',
      'zeke': 'Zeke',
      'jack': 'JackSlayerTheBeanSlasher'
    }

def testChat(player, chatName, shouldBeMember):

  driver.SwitchUser(player)
  
  try:
   driver.Click([[By.NAME, 'close-notification']])
  except AssertionError:
    pass # This user didn't have a notification

  if shouldBeMember:
    driver.DrawerMenuClick('mobile-main-page', 'Chat')
    driver.Click([[By.NAME, 'chat-card'], [By.NAME, chatName]]) # aaah, crashed here too on mobile

    # # TODO(verdagon): known flake (on remote only? ... nope :( I'm having this trouble locally too. -aliengirl)
    # This is probably because clicking the X on the notification didn't make it go away.
    driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-%s' % chatName]])
    driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-%s' % chatName], [By.NAME, 'num-players']])
    driver.FindElement(
      [[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-%s' % chatName], [By.NAME, playerNames[player]]])

    # Check the profile pic shows up
    # NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
    pic = driver.FindElement(
      [[By.NAME, 'chat-card'], 
      [By.NAME, 'chat-drawer-%s' % chatName], 
      [By.NAME, playerNames[player]],
      [By.CLASS_NAME, 'profile-pic']])
    assert(pic.get_attribute('style') != u'background-image: url("");')

    driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-%s' % chatName]])

    # Post a message
    driver.FindElement([[By.NAME, "ChatRoom: %s" % chatName]], check_visible=False) # Check that the chat exists
    driver.SendKeys([
      [By.NAME, 'chat-card'], 
      [By.NAME, 'input-%s' % chatName], 
      [By.TAG_NAME, 'textarea']], 'Brains for %s' % player)
    driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'submit-%s' % chatName]])

    # Make sure the element shows up
    driver.FindElement([[By.NAME, 'chat-card'], [By.CLASS_NAME, 'message-from-me']])
    driver.ExpectContains([[By.NAME, 'chat-card']], 'Brains for %s' % player)
    driver.DrawerMenuClick('chat-card', 'Dashboard')

  else:
    driver.DrawerMenuClick('mobile-main-page', 'Chat')
    driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], chatName, should_exist=False)
    driver.DrawerMenuClick('chat-card', 'Dashboard')

# GLOBAL CHAT ROOM - all types of joined players + admins should view.
testChat('jack', 'Global Chat', True) # Human
testChat('zeke', 'Global Chat', True) # Zombie
testChat('deckerd', 'Global Chat', True) # Undeclared


# HORDE CHAT ROOM - only declared zombies should view
testChat('jack', 'Horde ZedLink', False) # Human
testChat('zeke', 'Horde ZedLink', True) # Zombie
testChat('deckerd', 'Horde ZedLink', False) # Undeclared

# HUMAN CHAT ROOM - only declared humans should view
testChat('jack', 'Resistance Comms Hub', True) # Human
testChat('zeke', 'Resistance Comms Hub', False) # Zombie
testChat('deckerd', 'Resistance Comms Hub', False) # Undeclared

driver.Quit()


