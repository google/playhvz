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

try:
  # Go to the admin rewards section
  driver.DrawerMenuClick('mobile-main-page', 'Admin Rewards')
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'add']])

  # Make reward category.
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Lord Gnasher the Hungry Reward")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Gnasher")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "google.com")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "Show off how much you love eating humans!")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Verify that it shows up
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Lord Gnasher the Hungry Reward')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Gnasher')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], '2')

  # Edit the category
  driver.TableMenuClick([[By.NAME, 'row-Gnasher']], 'Edit')
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Good Flosser Badge")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Flosser")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "3")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "2")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A reward you get for brushing and flossing after eating humans.")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Generate 22 rewards.
  driver.TableMenuClick([[By.NAME, 'row-Flosser']], 'Show Rewards')
  driver.SendKeys([[By.ID, 'newReward'], [By.TAG_NAME, 'input']], "22")
  driver.Click([[By.ID, 'addReward']])

  # Check that at least some are there
  driver.ExpectContains([[By.NAME, 'row-Flosser 0']], '(unclaimed)')
  driver.ExpectContains([[By.NAME, 'row-Flosser 21']], '(unclaimed)')

  # Export the rewards.
  driver.TableMenuClick([[By.NAME, 'row-Flosser']], 'Export Rewards')
  driver.ExpectContains([[By.ID, 'codesDialogContents']], 'Flosser 0')
  driver.ExpectContains([[By.ID, 'codesDialogContents']], 'Flosser 21')
  driver.Click([[By.ID, 'codesDialog'],[By.NAME, 'done']])

  # Zeke was a cool zombie! He ate a bunch of humans, then brushed and flossed his teeth. He was awarded a reward.

  driver.SwitchUser('zeke')

  # Before claiming the reward, Zeke has 0 points
  driver.DrawerMenuClick('mobile-main-page', 'Leaderboard')
  driver.ExpectContains([[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell Zeke']], "0")

  # Zeke claims the reward
  driver.DrawerMenuClick('leaderboard-card', 'Dashboard')
  driver.SendKeys([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']], 'Flosser 0')
  driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'claim']])
  driver.ExpectContains([[By.NAME, 'rewards-box']], "Congratulations, you've claimed the reward")
  driver.ExpectContains([[By.NAME, 'rewards-box']], "Flosser")
  driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'done']])
  driver.FindElement([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']])

  driver.DrawerMenuClick('mobile-main-page', 'Leaderboard')

  # After claiming the reward, Zeke has 3 points
  driver.ExpectContains([[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell Zeke']], "3")

  driver.DrawerMenuClick('leaderboard-card', 'Dashboard')

  # # Zeke tries to claim another reward in the same category - it works! #TODO(someone who's not me): it doesn't work :(
  # driver.SendKeys([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']], 'Flosser 1')
  # driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'claim']])
  # driver.ExpectContains([[By.NAME, 'rewards-box']], "Congratulations, you've claimed the reward")
  # driver.ExpectContains([[By.NAME, 'rewards-box']], "Flosser")

  # Zeke tries to claim another reward in the same category - no luck (his max is 2)
  driver.SendKeys([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']], 'Flosser 2')
  driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'claim']])
  driver.ExpectContains([[By.NAME, 'rewards-box']], "Congratulations, you've claimed the reward", should_exist=False)


  driver.Quit()

finally:
  pass