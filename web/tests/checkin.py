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
import time
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import time #bad bad bad

try:

  # Sign in as an admin
  driver = setup.MakeDriver(user="zella")

  ######################  Testing Admin Guns Page  ######################

  # Close the notification
  driver.Click([[By.NAME, 'close-notification']])

  # Admin adds gun
  driver.DrawerMenuClick('mobile-main-page', 'Admin Guns')

  driver.Click([[By.ID, 'add']])
  driver.SendKeys(
        [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
        '3.14') # Crashed here a few times (element not visible, although it looks invisible)
 
  driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])

  # View added gun
  driver.ExpectContains([[By.NAME, 'gun-row-3.14']], "3.14")

  # Assign player a gun
  driver.Click([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'pencil']])

  driver.SendKeys([[By.TAG_NAME, 'ghvz-guns'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], 'JackSlayerTheBeanSlasher')
  driver.SendKeys([[By.TAG_NAME, 'ghvz-guns'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], Keys.RETURN)

  # Show that player shows up as having the gun
  driver.ExpectContains([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'player-label']], "JackSlayerTheBeanSlasher")

  #Add another gun, assign to another player
  driver.Click([[By.ID, 'add']])
  driver.SendKeys(
        [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
        'pancake')
  driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])
  driver.Click([[By.NAME, 'gun-row-pancake'], [By.CLASS_NAME, 'pencil']])
  driver.SendKeys([[By.TAG_NAME, 'ghvz-guns'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], 'MoldaviTheMoldavish')
  driver.SendKeys([[By.TAG_NAME, 'ghvz-guns'], [By.TAG_NAME, 'ghvz-player-dialog'], [By.TAG_NAME, 'input']], Keys.RETURN)

  # Search by label
  driver.Click([[By.NAME, 'header-Label'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Label'], [By.TAG_NAME, 'input']],
        'pan')
  driver.FindElement([[By.NAME, 'gun-row-pancake']])
  driver.FindElement([[By.NAME, 'gun-row-3.14']], should_exist=False)
  driver.Backspace([[By.NAME, 'header-Label'], [By.TAG_NAME, 'input']], 3)

  # Search by player
  driver.Click([[By.NAME, 'header-Player'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Player'], [By.TAG_NAME, 'input']],
        'Jack')
  driver.FindElement([[By.NAME, 'gun-row-pancake']], should_exist=False)
  driver.FindElement([[By.NAME, 'gun-row-3.14']])
  driver.Backspace([[By.NAME, 'header-Player'], [By.TAG_NAME, 'input']], 4)

  # Change the weapon ID, and show that it shows up
  driver.TableMenuClick([[By.NAME, 'gun-row-3.14']], 'Edit')
  driver.SendKeys(
        [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
        '42')
  driver.Click([[By.ID, 'gunForm'], [By.ID, 'done']])
  driver.ExpectContains([[By.NAME, 'gun-row-42']], "42")
   
  # TODO - when implemented, have a player see that they've been assigned a gun
   


  ####################  Testing Admin Players Page  ######################


  # Admin - set got equipment for Jack
  driver.DrawerMenuClick('guns-card', 'Admin Players')
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
  driver.ExpectContains([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'gotEquipment']], "No") # TODO - sometimes crashes here

  # Check Jack's profile, make sure the change showed up
  driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']])
  driver.ExpectContains([[By.NAME, 'got-equipment']], "No")

  # Go back to the Admin Players page
  driver.DrawerMenuClick('profile-card', 'Admin Players')

  # TODO(aliengirl): figure out why this isn't working
  # Search by number
  # driver.Click([[By.NAME, 'header-#'], [By.NAME, 'icon-search']])
  # driver.SendKeys(
  #       [[By.NAME, 'header-#'], [By.TAG_NAME, 'input']],
  #       '3')
  # driver.ExpectContains([[By.NAME, 'player-table']], "Jack") # Jack should show up
  # driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd", False) # Deckerd shouldn't show up
  # driver.Backspace([[By.NAME, 'header-#'], [By.TAG_NAME, 'input']])

  # # Search by name
  driver.Click([[By.NAME, 'player-table'], [By.NAME, 'header-Name'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'players-card'], [By.NAME, 'header-Name'], [By.TAG_NAME, 'input']],
        'Deckerd')
  driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd") # Deckerd should show up
  driver.ExpectContains([[By.NAME, 'player-table']], "Jack", False) # Jack shouldn't show up
  driver.Backspace([[By.NAME, 'players-card'], [By.NAME, 'header-Name'], [By.TAG_NAME, 'input']], 7)

  # TODO - search by equipment once this works

  # Add a note
  driver.DrawerMenuClick('players-card', 'Admin Players')  # TODO(aliengirl): once failed here -m
  driver.TableMenuClick([[By.NAME, 'player-row-JackSlayerTheBeanSlasher']], 'Set Notes')
  driver.SendKeys([[By.ID, 'notesInput'], [By.TAG_NAME, 'input']],'zapfinkle skaddleblaster')
  driver.Click([[By.ID, 'notesForm'], [By.ID, 'done']])

  # Search by notes
  driver.Click([[By.NAME, 'header-Extra'], [By.NAME, 'icon-search']])
  driver.SendKeys(
    [[By.NAME, 'header-Extra'], [By.TAG_NAME, 'input']],
    'zap')
  driver.ExpectContains([[By.NAME, 'player-table']], "Jack") # Jack should show up
  driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd", False) # Deckerd shouldn't show up

  driver.Quit()

finally:
  pass
