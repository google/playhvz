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

# Check that an admin can send a notification blast to everyone
driver.DrawerMenuClick('mobile-main-page', 'Admin Notifications')
driver.Click([[By.NAME, 'admin-notifications-card'], [By.ID, 'add']])
driver.Click([[By.ID, 'form-section-recievers-group'], [By.ID, 'name']])
driver.Click([[By.NAME, 'group-name-Everyone']])
driver.Click([[By.ID, 'form-section-send-web'], [By.TAG_NAME, 'paper-checkbox']])
driver.SendKeys([[By.ID, 'form-section-preview-message'], [By.TAG_NAME, 'input']], "The Horde is coming")
driver.SendKeys([[By.ID, 'form-section-detailed-message'], [By.TAG_NAME, 'textarea']], "The Horde of hungry zombies is coming. So we should really, like, run for our lives.")
driver.Click([[By.NAME, 'form-buttons-Notification Category'], [By.ID, 'done']])


# Show that the blast appeared on the admin notifications page
driver.ExpectContains([[By.NAME, 'row-The Horde is coming']], 'The Horde is coming')
driver.ExpectContains([[By.NAME, 'row-The Horde is coming']], 'Everyone')

# Check that a player can see it
driver.SwitchUser('jack')
#Close the Mission 1 notification
driver.Click([[By.NAME, 'notification-preview-Mission 1 Details: the zeds have invaded!'], [By.NAME, 'close-notification']])
driver.FindElement([[By.NAME, 'preview-Mission 1 Details: the zeds have invaded!']], should_exist=False)
driver.ExpectContains([[By.NAME, 'preview-The Horde is coming']], 'The Horde is coming') 
driver.Click([[By.NAME, 'preview-The Horde is coming']])
driver.FindElement([[By.NAME, 'preview-The Horde is coming']], should_exist=False)

#Clicking the  notification should navigate Jack to the notifications page.
driver.FindElement([[By.NAME, 'notifications-card']])
driver.ExpectContains([[By.NAME, 'expandable-The Horde is coming']], 'The Horde is coming')
driver.ExpectContains([[By.NAME, 'expandable-The Horde is coming']], "The Horde of hungry zombies is coming. So we should really, like, run for our lives.")

# Clicking the preview toggles whether the full text shows up
driver.RetryUntil(
  lambda: driver.Click([[By.NAME, 'expandable-The Horde is coming']]),
  lambda: driver.ExpectContains(
    [[By.NAME, 'expandable-The Horde is coming'], [By.TAG_NAME, 'ghvz-notification-preview']], 
    "The Horde of hungry zombies is coming. So we should really, like, run for our lives.", 
    should_exist=False))

driver.RetryUntil(
  lambda: driver.Click([[By.NAME, 'expandable-The Horde is coming'], [By.TAG_NAME, 'ghvz-notification-preview']]),
  lambda: driver.ExpectContains(
    [[By.NAME, 'expandable-The Horde is coming']], 
    "The Horde of hungry zombies is coming. So we should really, like, run for our lives.", 
    should_exist=True))

driver.Quit()





