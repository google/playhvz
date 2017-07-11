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

# Check that Drake has 3 rewards on the leaderboard and 4 on his profile page
driver.DrawerMenuClick('mobile-main-page', 'Leaderboard')
driver.FindElement([
    [By.NAME, 'leaderboard-card'], 
    [By.NAME, 'Leaderboard Name Cell Drackan'], 
    [By.NAME, 'reward-cat-0']])
driver.FindElement([
    [By.NAME, 'leaderboard-card'], 
    [By.NAME, 'Leaderboard Name Cell Drackan'], 
    [By.NAME, 'reward-cat-1']])
driver.FindElement([
    [By.NAME, 'leaderboard-card'], 
    [By.NAME, 'Leaderboard Name Cell Drackan'], 
    [By.NAME, 'reward-cat-2']])
driver.FindElement([
    [By.NAME, 'leaderboard-card'], 
    [By.NAME, 'Leaderboard Name Cell Drackan'], 
    [By.NAME, 'reward-cat-3']], should_exist=False)

driver.TableMenuClick([[By.NAME, 'leaderboard-card'], [By.NAME, 'leaderboard-player-row-Drackan']], 'View')
driver.FindElement([[By.NAME, 'profile-card'], [By.NAME, 'reward-signed up!']])
driver.FindElement([[By.NAME, 'profile-card'], [By.NAME, 'reward-did the thing!']])
driver.FindElement([[By.NAME, 'profile-card'], [By.NAME, 'reward-found a leaf!']])
driver.FindElement([[By.NAME, 'profile-card'], [By.NAME, 'reward-i know geno!']])


# Go to the admin rewards section
driver.DrawerMenuClick('profile-card', 'Admin Rewards')
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
driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], 63)
driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A reward you get for brushing and flossing after eating humans.")
driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

# Generate 2 rewards. # TODO(aliengirl): at some point there was an issue with generating too many of these. Revisit this sometime.
driver.TableMenuClick([[By.NAME, 'row-Flosser']], 'Show Rewards')
driver.SendKeys([[By.ID, 'newReward'], [By.TAG_NAME, 'input']], "2")
driver.Click([[By.ID, 'addReward']])

# Check that at least some are there
# NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
reward1 = driver.FindElement([[By.ID, 'rewardsTable'], [By.NAME, 'reward-name-0']]).get_attribute('val')
reward2 = driver.FindElement([[By.ID, 'rewardsTable'], [By.NAME, 'reward-name-1']]).get_attribute('val')

driver.ExpectContains([[By.ID, 'rewardsTable'], [By.CLASS_NAME, 'row']], '(unclaimed)')

# Export the rewards.
driver.TableMenuClick([[By.NAME, 'row-Flosser']], 'Export Rewards')
driver.ExpectContains([[By.ID, 'codesDialogContents']], reward1)
driver.Click([[By.ID, 'codesDialog'],[By.NAME, 'done']])

# Zeke was a cool zombie! He ate a bunch of humans, then brushed and flossed his teeth. He was awarded a reward.

driver.SwitchUser('zeke')

# Before claiming the reward, Zeke has 0 points
driver.DrawerMenuClick('mobile-main-page', 'Leaderboard')
driver.ExpectContains([[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell Zeke']], "0")

# Zeke claims the reward
driver.DrawerMenuClick('leaderboard-card', 'Rewards')
driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], reward1)
driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])
driver.ExpectContains([[By.NAME, 'rewards-card']], "Congratulations, you've claimed the reward")
driver.ExpectContains([[By.NAME, 'rewards-card']], "Flosser")
driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'done']])
driver.FindElement([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']])

driver.DrawerMenuClick('rewards-card', 'Leaderboard')

# After claiming the reward, Zeke has 3 points, and the badge shows up in the Leaderboard
# NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
driver.ExpectContains([[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell Zeke']], "3")
pic = driver.FindElement([
    [By.NAME, 'leaderboard-card'], 
    [By.NAME, 'Leaderboard Name Cell Zeke'], 
    [By.NAME, 'reward-Good Flosser Badge'],
    [By.TAG_NAME, 'img']])
assert pic.get_attribute('src') == "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png"

# Badge also shows up on his profile
driver.DrawerMenuClick('leaderboard-card', 'My Profile')
driver.ExpectContains([[By.NAME, 'profile-card'], [By.NAME, 'reward-Good Flosser Badge']], 'Good Flosser Badge')
driver.ExpectContains(
  [[By.NAME, 'profile-card'], [By.NAME, 'reward-Good Flosser Badge']], 
  'A reward you get for brushing and flossing after eating humans.')
# NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
pic = driver.FindElement([[By.NAME, 'profile-card'], [By.NAME, 'reward-Good Flosser Badge'], [By.TAG_NAME, 'img']])
assert pic.get_attribute('src') == "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png"


# driver.DrawerMenuClick('profile-card', 'Rewards')


# Zeke tries to claim another reward in the same category - it works!
driver.DrawerMenuClick('profile-card', 'Rewards')
driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], reward2)
driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])
driver.ExpectContains([[By.NAME, 'rewards-card']], "Congratulations, you've claimed the reward")
driver.ExpectContains([[By.NAME, 'rewards-card']], "Flosser")

# TODO(aliengirl): once the site actually deals with player reward caps, have Zeke claim a second one
# # Zeke tries to claim another reward in the same category - no luck (his max is 2)
# driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], reward2)
# driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])
# driver.ExpectContains([[By.NAME, 'rewards-card']], "Congratulations, you've claimed the reward", should_exist=False)

# Another player tries to claim the reward Zeke just claimed
driver.SwitchUser('drake')
driver.DrawerMenuClick('mobile-main-page', 'Rewards')
driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], reward1)
driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])
driver.DismissAlert('This reward has already been claimed!')

# Drake tries to claim an invalid reward code
driver.Clear([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']])
driver.SendKeys([[By.NAME, 'rewards-card'], [By.TAG_NAME, 'input']], "definitely not a reward code")
driver.Click([[By.NAME, 'rewards-card'], [By.ID, 'claim']])
driver.DismissAlert('No reward with that code exists!')

# TODO(aliengirl): 
# # Zella (admin) sees that the code has been claimed by Zeke
# driver.SwitchUser('zella')
# driver.DrawerMenuClick('mobile-main-page', 'Admin Rewards')
# driver.TableMenuClick([[By.NAME, 'row-Flosser']], 'Show Rewards')
# driver.ExpectContains([[By.NAME, 'row-Flosser 0']], "Zeke")

driver.Quit()
  