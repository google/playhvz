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

import setup
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = setup.MakeDriver(user="zella")

  driver.Click([[By.NAME, 'close-notification']])

  # Give Zella a reward (just so that she has more points than Moldavi)
  driver.DrawerMenuClick('mobile-main-page', 'Admin Rewards')
  driver.TableMenuClick([[By.NAME, 'row-signed']], 'Show Rewards')
  driver.Click([[By.NAME, 'header-Claimer'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Claimer'], [By.TAG_NAME, 'input']],
        'unclaimed')
  # NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
  reward = driver.FindElement([[By.ID, 'rewardsTable'], [By.NAME, 'reward-name']]).get_attribute('val')

  driver.DrawerMenuClick('admin-rewards-card', 'Rewards')
  driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], reward)
  driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])

  # Switch to a normal human (Jack)

  driver.SwitchUser('jack')

  driver.Click([[By.NAME, 'close-notification']])
  driver.DrawerMenuClick('mobile-main-page', 'Chat')

  # Jack creates his own personal chatroom with no other player
  driver.Click([[By.ID, 'new-chat']])
  driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], 'Secret Stuff')
  driver.Click([[By.ID, 'allegianceFilter'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'canAddOthers'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'settingsForm'], [By.ID, 'dialog'], [By.ID, 'done']])
  driver.DrawerMenuClick('chat-card', 'Secret Stuff')

  # Jack creates a chatroom with other players
  driver.DrawerMenuClick('chat-card', 'Chat')
  driver.Click([[By.ID, 'new-chat']])
  driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], "Humanity's Last Hope")
  driver.Click([[By.ID, 'allegianceFilter'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'canAddOthers'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'settingsForm'], [By.ID, 'dialog'], [By.ID, 'done']])
  if driver.is_mobile:
    driver.FindElement([[By.NAME, "chat-info-Humanity's Last Hope"]])
  else:
    driver.FindElement([[By.NAME, "drawerHumanity's Last Hope"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-info-Humanity's Last Hope"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "player-name-MoldaviTheMoldavish"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "player-name-ZellaTheUltimate"]])


  # Jack gets infected by Drake
  driver.SwitchUser('drake')
  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')

  driver.Click([[By.ID, 'infect']])

  # Jack shouldn't see either chat anymore
  driver.FindElement([[By.NAME, 'drawer-Secret Stuff']], should_exist=False)
  driver.FindElement([[By.NAME, "drawer-Humanity's Last Hope"]], should_exist=False)

  # Sign in as Zella, make sure she's the owner
  driver.SwitchUser('zella')
  driver.DrawerMenuClick('rewards-card', 'Chat')

  # Open the drawer of each to check that Zella can add/bump people (i.e. is the owner)
  driver.Click([[By.TAG_NAME, 'ghvz-chat-room-list'], [By.NAME, "Humanity's Last Hope"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-info-Humanity's Last Hope"]])

  # Bump Moldavi
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], 
    [By.NAME, "chat-drawer-Humanity's Last Hope"], 
    [By.NAME, 'MoldaviTheMoldavish'], 
    [By.TAG_NAME, 'paper-icon-button']])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], 
    [By.NAME, "chat-drawer-Humanity's Last Hope"], 
    [By.NAME, 'MoldaviTheMoldavish'], 
    [By.ID, 'kick-MoldaviTheMoldavish']])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.ID, 'kickForm'], [By.ID, 'done']])

  # Add Moldavi back in
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.NAME, "player-name-MoldaviTheMoldavish"]])

  driver.Quit()

finally:
  pass