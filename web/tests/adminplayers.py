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
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

# Set got equipment for Jack
driver.DrawerMenuClick('mobile-main-page', 'Admin Players')
driver.TableMenuClick([[By.NAME, 'player-row-JackSlayerTheBeanSlasher']], 'Set Got Equipment') # Doesn't update like it's supposed to - remote server

# Check Jack's profile, make sure the change showed up
driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']])
driver.ExpectContains([[By.NAME, 'got-equipment']], "Yes")

# If you set the equipment of someone who already has it, nothing should happen
driver.DrawerMenuClick('profile-card', 'Admin Players')
driver.TableMenuClick([[By.NAME, 'player-row-JackSlayerTheBeanSlasher']], 'Set Got Equipment')
driver.ExpectContains([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'gotEquipment']], "Yes") # Menu still open here

# Unset Jack's equipment
driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.NAME, 'menu-item-Unset Got Equipment']]) 
driver.ExpectContains([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'gotEquipment']], "No")

# Check Jack's profile, make sure the change showed up
driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']])
driver.ExpectContains([[By.NAME, 'got-equipment']], "No")

# Go back to the Admin Players page
driver.DrawerMenuClick('profile-card', 'Admin Players')

# Search by number
driver.Click([[By.NAME, 'header-#'], [By.NAME, 'icon-search']])
driver.SendKeys(
      [[By.NAME, 'header-#'], [By.TAG_NAME, 'input']],
      '4')
driver.ExpectContains([[By.NAME, 'player-table']], "Jack") # Jack should show up
driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd", False) # Deckerd shouldn't show up
driver.Backspace([[By.NAME, 'header-#'], [By.TAG_NAME, 'input']])

# # Search by name
driver.Click([[By.NAME, 'player-table'], [By.NAME, 'header-Name'], [By.NAME, 'icon-search']])
driver.SendKeys(
      [[By.NAME, 'players-card'], [By.NAME, 'header-Name'], [By.TAG_NAME, 'input']],
      'Deckerd')
driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd") # Deckerd should show up
driver.ExpectContains([[By.NAME, 'player-table']], "Jack", False) # Jack shouldn't show up
driver.Backspace([[By.NAME, 'players-card'], [By.NAME, 'header-Name'], [By.TAG_NAME, 'input']], 7)

# Search by Equipment
driver.Click([[By.NAME, 'player-table'], [By.NAME, 'header-Equipment'], [By.NAME, 'icon-search']])
driver.SendKeys(
      [[By.NAME, 'players-card'], [By.NAME, 'header-Equipment'], [By.TAG_NAME, 'input']],
      'Yes')
driver.ExpectContains([[By.NAME, 'player-table']], "Moldavi") # Moldavi should show up
driver.ExpectContains([[By.NAME, 'player-table']], "Jack", False) # Jack shouldn't show up
driver.Backspace([[By.NAME, 'players-card'], [By.NAME, 'header-Equipment'], [By.TAG_NAME, 'input']], 3)

# Add a note
driver.DrawerMenuClick('players-card', 'Admin Players')
driver.TableMenuClick([[By.NAME, 'player-row-JackSlayerTheBeanSlasher']], 'Set Notes')
driver.SendKeys([[By.ID, 'notesInput'], [By.TAG_NAME, 'input']],'zapfinkle skaddleblaster') #TODO(aliengirl): failed 2x here
driver.Click([[By.ID, 'notesForm'], [By.ID, 'done']])

# Search by notes
# Click this button just b/c otherwise the Extra icon is hidden under the scrollbar
driver.Click([[By.NAME, 'player-table'], [By.NAME, 'header-Name'], [By.NAME, 'icon-search']]) #TODO(aliengirl): figure out a less weird way to make this work
driver.Click([[By.NAME, 'player-table'], [By.NAME, 'header-Extra'], [By.NAME, 'icon-search']])
driver.SendKeys(
  [[By.NAME, 'player-table'], [By.NAME, 'header-Extra'], [By.TAG_NAME, 'input']],
  'zap')
driver.ExpectContains([[By.NAME, 'player-table']], "Jack") # Jack should show up #TODO(aliengirl): failed here once
driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd", False) # Deckerd shouldn't show up
driver.Backspace([[By.NAME, 'player-table'], [By.NAME, 'header-Extra'], [By.TAG_NAME, 'input']], 3)

# Infect Jack
driver.DrawerMenuClick('players-card', 'Admin Players')
driver.TableMenuClick([[By.NAME, 'player-row-JackSlayerTheBeanSlasher']], 'Infect')
driver.DismissAlert()
driver.ExpectContains([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'allegiance']], "Horde")

# Revive Zeke
driver.TableMenuClick([[By.NAME, 'player-row-Zeke']], 'Add Life')
driver.DismissAlert()
driver.ExpectContains([[By.NAME, 'player-row-Zeke'], [By.ID, 'allegiance']], "Resistance")

# Revive Deckerd
driver.TableMenuClick([[By.NAME, 'player-row-DeckerdTheHesitant']], 'Add Life')
driver.DismissAlert()
driver.ExpectContains([[By.NAME, 'player-row-DeckerdTheHesitant'], [By.ID, 'allegiance']], "Resistance")

# Add Life to Zella (already a human, but that's fine, she just has an extra life)
driver.TableMenuClick([[By.NAME, 'player-row-ZellaTheUltimate']], 'Add Life')
driver.ExpectContains([[By.NAME, 'player-row-ZellaTheUltimate'], [By.ID, 'allegiance']], "Resistance")

# Make sure the infections/revivals are reflected on the players' pages
driver.DrawerMenuClick('players-card', 'Dashboard')
driver.FindElement([[By.TAG_NAME, 'ghvz-infect']], should_exist=False)
driver.DrawerMenuClick('mobile-main-page', 'Chat')
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Resistance Comms Hub')

# Check that Deckerd is a human (sees human chat and no infect widget)
driver.SwitchUser('deckerd')
driver.FindElement([[By.TAG_NAME, 'ghvz-infect']], should_exist=False)
driver.DrawerMenuClick('mobile-main-page', 'Chat')
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Resistance Comms Hub')

# Check that Zeke is a human (sees human chat and no infect widget)
driver.SwitchUser('zeke')
driver.FindElement([[By.TAG_NAME, 'ghvz-infect']], should_exist=False)
driver.DrawerMenuClick('mobile-main-page', 'Chat')
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Resistance Comms Hub')

# Check that Jack is a zombie (sees human chat and no infect widget)
driver.SwitchUser('jack')
driver.FindElement([[By.TAG_NAME, 'ghvz-infect']], should_exist=True)
driver.DrawerMenuClick('mobile-main-page', 'Chat')
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Horde ZedLink')

driver.Quit()

