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

try:

  # Sign in as an admin
  driver = setup.MakeDriver(user="zella")

  # Go to Jack's profile (currently can't infect)
  driver.DrawerMenuClick('mobile-main-page', 'Admin Players')
  driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']]) 

  # Click the Set Can Infect button
  driver.Click([[By.ID, 'set-infect-button']])
  driver.FindElement([[By.ID, 'unset-infect-button']])
  driver.ExpectContains([[By.NAME, 'can-infect']], "Yes")

  # Sign in as Jack, confirm that he can infect
  driver.SwitchUser("jack")
  driver.FindElement([[By.NAME, "infect-box"]])
  driver.SendKeys(
        [[By.NAME, 'infect-box'], [By.TAG_NAME, 'input']],
        'glarple zerp wobbledob') # Zella's life code
  driver.Click([[By.ID, 'infect']])
  driver.ExpectContains([[By.NAME, 'infect-box']], "you've infected ZellaTheUltimate!")

  # Sign back in as Zella (admin)
  driver.SwitchUser("zella")

  # Check her profile, see that she's still a human
  driver.DrawerMenuClick('profile-card', 'My Profile')
  driver.ExpectContains([[By.NAME, 'status']], "Alive")

  # Confirm that she can infect people now
  driver.DrawerMenuClick('profile-card', 'Dashboard')
  driver.FindElement([[By.NAME, "infect-box"]])

  # Unset Can Infect for Zella
  driver.DrawerMenuClick('mobile-main-page', 'My Profile')
  driver.Click([[By.ID, 'unset-infect-button']])
  driver.FindElement([[By.ID, 'set-infect-button']])
  driver.ExpectContains([[By.NAME, 'can-infect']], "No")

  # Confirm that she can no longer infect people
  driver.FindElement([[By.NAME, "infect-box"]], should_exist=False)

  driver.Quit()

finally:
  pass



