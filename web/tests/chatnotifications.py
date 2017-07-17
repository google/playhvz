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
from selenium.webdriver.common.keys import Keys

def SendMessage(message, chatName, reciever, sender, shouldFail=False, failMessage=None):
  driver.Clear([[By.NAME, 'chat-card'], 
      [By.NAME, 'input-%s' % chatName], 
      [By.TAG_NAME, 'textarea']])
  driver.SendKeys([
      [By.NAME, 'chat-card'], 
      [By.NAME, 'input-%s' % chatName], 
      [By.TAG_NAME, 'textarea']], '@%s %s' % (reciever, message))
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'submit-%s' % chatName]])
  if shouldFail:
    driver.DismissAlert(failMessage)
  else:
    pass
    #driver.FindElement([[By.NAME, 'message-%s-@%s %s' % (chatName, reciever, message)]])
  driver.FindElement([[By.NAME, 'preview-%s: %s' % (sender, message)]], should_exist=False)

# Sign in as a normal human.
driver = setup.MakeDriver(user="zella")

driver.Click([[By.NAME, 'close-notification']])

# Zella send @message to person who doesn't exit - should give an error
driver.DrawerMenuClick('mobile-main-page', 'Global Chat')
SendMessage(
  'I have a new upgrade Im gonna try!', 
  'Global Chat', 
  'BarryTheBadass',
  'ZellaTheUltimate',
  True, 
  "Couldn't find a player by the name 'BarryTheBadass' in this chat room!")

# Zella sends @all message in global chat
SendMessage(
  'New upgrade available - the Crabwalk!',
  'Global Chat',
  'all',
  'ZellaTheUltimate')

# Zella sends @JackSlayerTheBeanSlasher message in resistance chat
driver.DrawerMenuClick('chat-card', 'Resistance Comms Hub')
SendMessage(
  'Wanna be our crabwalk zombie?',
  'Resistance Comms Hub',
  'JackSlayerTheBeanSlasher',
  'ZellaTheUltimate')

# Zella sends herself a message
SendMessage(
  "You're totally the coolest person I've ever met",
  'Resistance Comms Hub',
  'ZellaTheUltimate',
  'ZellaTheUltimate')

# Zella sends empty @ message in private chat with Jack
driver.DrawerMenuClick('chat-card', 'New chat')
driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], "Legendary Humans")
driver.Click([[By.ID, 'settingsForm'], [By.ID, 'done']])
driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, "chat-room-Legendary Humans"]])
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-Legendary Humans']])
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-add']])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], 'JackSlayerTheBeanSlasher')
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], Keys.RETURN)
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-Legendary Humans']])
SendMessage(
  "",
  'Legendary Humans',
  'JackSlayerTheBeanSlasher',
  'ZellaTheUltimate')

# Zella sends and egregiously long @ message
SendMessage(
  "Pronounced as one letter, And written with three, Two letters there are, And two only in me. I'm double, I'm single, I'm black, blue, and gray, I'm read from both ends, And the same either way. What am I? src=http://www.doriddles.com/riddle-664#show",
  'Legendary Humans',
  'JackSlayerTheBeanSlasher',
  'ZellaTheUltimate')

#TODO(aliengirl): Check none of these show up on the admin notifications page

# Sign in as Jack
driver.SwitchUser('jack')

# Check all the notifications are showing up
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: New upgrade available - the Crabwalk!']])
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: Wanna be our crabwalk zombie?']])
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: ']])
driver.FindElement([[By.NAME, "notification-preview-ZellaTheUltimate: Pronounced as one letter, And written with three, Two letters there are, And two only in me. I'm double, I'm single, I'm black, blue, and gray, I'm read from both ends, And the same either way. What am I? src=http://www.doriddles.com/riddle-664#show"]])

# Click the first notification, check it takes him to the chatroom
driver.Click([[By.NAME, 'notification-preview-ZellaTheUltimate: New upgrade available - the Crabwalk!']])
driver.FindElement([[By.NAME, 'chat-room-Global Chat']])
# driver.FindElement([[By.NAME, 'message-@all New upgrade available - the Crabwalk!']])

# Check the notifications page, make sure they're all there
driver.DrawerMenuClick('chat-card', 'Notifications')
driver.FindElement([[By.NAME, 'notifications-card']])
# TODO(aliengirl): Check that the side ones disappeared.
driver.FindElement([[By.NAME, 'notifications-card'], [By.NAME, 'preview-ZellaTheUltimate: New upgrade available - the Crabwalk!']])
driver.FindElement([[By.NAME, 'notifications-card'], [By.NAME, 'preview-ZellaTheUltimate: Wanna be our crabwalk zombie?']])
driver.FindElement([[By.NAME, 'notifications-card'], [By.NAME, 'preview-ZellaTheUltimate: ']])
driver.FindElement([[By.NAME, 'notifications-card'], [By.NAME, "preview-ZellaTheUltimate: Pronounced as one letter, And written with three, Two letters there are, And two only in me. I'm double, I'm single, I'm black, blue, and gray, I'm read from both ends, And the same either way. What am I? src=http://www.doriddles.com/riddle-664#show"]])

# Unseen notifications disappear
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: New upgrade available - the Crabwalk!']], should_exist=False)
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: Wanna be our crabwalk zombie?']], should_exist=False)
driver.FindElement([[By.NAME, 'notification-preview-ZellaTheUltimate: ']], should_exist=False)
driver.FindElement([[By.NAME, "notification-preview-ZellaTheUltimate: Pronounced as one letter, And written with three, Two letters there are, And two only in me. I'm double, I'm single, I'm black, blue, and gray, I'm read from both ends, And the same either way. What am I? src=http://www.doriddles.com/riddle-664#show"]], should_exist=False)


# Click on one, make sure it takes him to the chat page
driver.Click([[By.NAME, 'notifications-card'], [By.NAME, 'preview-ZellaTheUltimate: ']])
#TODO(aliengirl): find element
# Jack makes sure the messages are all there in the chats

# Jack leaves the private chat
driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-info-Legendary Humans"]])
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-leave']])
driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-room-Legendary Humans"], [By.ID, 'leaveForm'], [By.ID, 'done']])

# Jack clicks on the other notification to the private chat - should not take him there (since he's not in the group)
driver.DrawerMenuClick('chat-card', 'Notifications')
driver.Click([[By.NAME, 'notifications-card'], [By.NAME, "preview-ZellaTheUltimate: Pronounced as one letter, And written with three, Two letters there are, And two only in me. I'm double, I'm single, I'm black, blue, and gray, I'm read from both ends, And the same either way. What am I? src=http://www.doriddles.com/riddle-664#show"]])
driver.FindElement([[By.NAME, 'chat-room-Legendary-Humans']], should_exist=False)
driver.DrawerMenuClick('chat-card', 'Global Chat')

# Jack sends a message back to Zella, using weird capitalization
SendMessage(
  "I'll totally be the crab zombie!... although I am human",
  'Global Chat',
  'zElLaThEuLtImAtE',
  'JackSlayerTheBeanSlasher')

# Zella sees the message
driver.SwitchUser('zella')
driver.FindElement([[By.NAME, "notification-preview-JackSlayerTheBeanSlasher: I'll totally be the crab zombie!... although I am human"]])
driver.Quit()

