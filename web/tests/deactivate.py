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
import sys
from driver import WholeDriver
import setup

from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

driver.DrawerMenuClick('Admin Players')
# Go to Jack's profile, deactivate him
driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']]) 
driver.Click([[By.NAME, 'deactivate-button']])
driver.FindElement([[By.NAME, 'activate-button']])
driver.ExpectContains([[By.NAME, 'active']], "No")

# See that the players list shows Jack isn't active
driver.DrawerMenuClick('Admin Players')
driver.FindElement([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'extra']], '!Active')
# NOTE: don't blindly copy this, it's very risky to use FindElement's return value.
nameDiv = driver.FindElement([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']])
unactive = nameDiv.get_attribute('inactive')
active = nameDiv.get_attribute('yoloa')
assert unactive != None;

driver.Quit()
