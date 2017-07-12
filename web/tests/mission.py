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
import time


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
import setup
from selenium.webdriver.common.by import By

def insertAndVerifyMissionInfo(
  name, 
  startYear, 
  startMonth, 
  startDay, 
  startTime, 
  endYear, 
  endMonth, 
  endDay, 
  endTime,
  details,
  groupName):

  driver.SendKeys([[By.ID, 'form-section-mission-name'],[By.TAG_NAME, 'input']], name) #TODO(aliengirl): Figure out why occasionally it says this element doesn't exist

  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']], startYear)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']], startMonth)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']], startDay)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 7)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']], startTime)

  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], endYear)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']], endMonth)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], endDay)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 7)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], endTime)

  driver.SendKeys([[By.ID, 'form-section-mission-details'],[By.TAG_NAME, 'textarea']], details)

  driver.Click([[By.ID, 'missionForm'], [By.ID, 'form-section-mission-group'], [By.ID, 'name']])
  driver.Click([[By.ID, 'missionForm'], [By.ID, 'form-section-mission-group'], [By.NAME, 'group-name-' + groupName]])
  driver.Click([[By.ID, 'missionForm'], [By.NAME, 'form-buttons-Mission'], [By.ID, 'done']])

  # Verify the mission shows up in the admin's list of missions
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionName']], name)
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionGroup']], groupName)
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionStart']], startTime)
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionEnd']], endTime)
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionDetails']], details[0:10])


driver = setup.MakeDriver(user="zella")

driver.DrawerMenuClick('mobile-main-page', 'Admin Missions')
driver.Click([[By.NAME, 'close-notification']])

# Delete the two missions which start out there
driver.TableMenuClick([[By.NAME, "mission-row-first zed mission!"]], 'Delete')

# TODO(verdagon): take this back out, was added in because of a weird menu issue that deleted both the missions
time.sleep(2)

driver.TableMenuClick([[By.NAME, "mission-row-first human mission!"]], 'Delete')

# Make sure both humans and zombies get a default message when no missions are posted.
driver.DrawerMenuClick('admin-missions-card', 'Dashboard')
driver.ExpectContains([[By.NAME, 'next-mission-box']], "The next mission's details will be posted here.")

driver.SwitchUser('zeke') # He's a zombie
driver.ExpectContains([[By.NAME, 'next-mission-box']], "The next mission's details will be posted here.")

# Log back in as an admin.
driver.SwitchUser('zella')
driver.DrawerMenuClick('mobile-main-page', 'Admin Missions')

# Create a human mission
driver.Click([[By.ID, 'add']])
insertAndVerifyMissionInfo(
  name='insert witty and entertaining name here',
  startYear='2017',
  startMonth='10',
  startDay='20',
  startTime='3:00am',
  endYear='2038',
  endMonth='4',
  endDay='2',
  endTime='10:15pm',
  details='<div>take over the world</div>',
  groupName='Resistance')

# Create a zombie mission
driver.Click([[By.ID, 'add']])
insertAndVerifyMissionInfo(
  name='zed mission',
  startYear='2017',
  startMonth='1',
  startDay='2',
  startTime='12:34am',
  endYear='2038',
  endMonth='4',
  endDay='2',
  endTime='2:34pm',
  details='<div>eat humans</div>',
  groupName='Horde')

# Log in as a human (Jack), make sure he can see the human mission but not the zombie mission
driver.SwitchUser('jack')

driver.ExpectContains([[By.NAME, 'next-mission-box']], 'take over the world')
driver.ExpectContains([[By.NAME, 'next-mission-box']], "Oct 20 3:00am") # start time
driver.ExpectContains([[By.NAME, 'next-mission-box']], "Apr 2 10:15pm") # end time
driver.ExpectContains([[By.NAME, 'next-mission-box']], 'eat humans', should_exist=False)

# Find the mission in the drawer as well
driver.DrawerMenuClick('mobile-main-page', 'Missions')
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-insert witty and entertaining name here']])
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-text-insert witty and entertaining name here']], "take over the world")
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-insert witty and entertaining name here']], "Oct 20 3:00am") # start time
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-insert witty and entertaining name here']], "Apr 2 10:15pm") # end time

# Log in as a zombie (Zeke), make sure he can see the zombie mission but not the human mission
driver.SwitchUser('zeke')
driver.ExpectContains([[By.NAME, 'next-mission-box']], 'eat humans')
driver.ExpectContains([[By.NAME, 'next-mission-box']], 'take over the world', should_exist=False)

# Find the missions in the drawer as well
driver.DrawerMenuClick('mobile-main-page', 'Missions')
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-zed mission']])
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-text-zed mission']], "eat humans")
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-zed mission']], "Jan 2 12:34am") # start time
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-zed mission']], "Apr 2 2:34pm") # end time

# As an admin, create another human mission
driver.SwitchUser('zella')

driver.Click([[By.ID, 'add']])
insertAndVerifyMissionInfo(
  name='Defeat the dread zombie boss Gnashable the Zeebweeble',
  startYear='2017',
  startMonth='9',
  startDay='20',
  startTime='3:00am',
  endYear='2037',
  endMonth='4',
  endDay='2',
  endTime='10:15pm',
  details='<div>Basically, we just run around in circles trying not to die.</div>',
  groupName='Everyone')

driver.SwitchUser('jack')

# On the dashboard the new mission shows up (since the end date is sooner than the other one)
driver.ExpectContains([[By.NAME, 'next-mission-box']], 'Basically, we just run around in circles trying not to die.')

# On the missions page, both should show up
driver.DrawerMenuClick('mobile-main-page', 'Missions')
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-insert witty and entertaining name here']])
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-Defeat the dread zombie boss Gnashable the Zeebweeble']])

# As an admin, change the mission end date to later than the other human mission
driver.SwitchUser('zella')
driver.DrawerMenuClick('mobile-main-page', 'Admin Missions')

driver.TableMenuClick([[By.NAME, 'mission-row-Defeat the dread zombie boss Gnashable the Zeebweeble']], 'Edit')
insertAndVerifyMissionInfo(
  name='Defeat the super scary awful zombie boss Gnashable the Zeebweeble',
  startYear='2018',
  startMonth='10',
  startDay='21',
  startTime='12:34pm',
  endYear='2039',
  endMonth='5',
  endDay='3',
  endTime='11:16pm',
  details='<div>Basically, we just run around in ellipses trying not to die.</div>',
  groupName='Everyone')

# Log in as a human (Jack). Show that the new mission doesn't show up anymore
driver.SwitchUser('jack')
driver.ExpectContains([[By.NAME, 'next-mission-box']], 'take over the world')

driver.DrawerMenuClick('mobile-main-page', 'Missions')

# On the missions page, both should show up
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-insert witty and entertaining name here']])
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-text-insert witty and entertaining name here']], "take over the world")
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-insert witty and entertaining name here']], "Oct 20 3:00am") # start time
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-insert witty and entertaining name here']], "Apr 2 10:15pm") # end time
driver.FindElement([[By.NAME, 'missions-card'], [By.NAME, 'mission-Defeat the super scary awful zombie boss Gnashable the Zeebweeble']])
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-text-Defeat the super scary awful zombie boss Gnashable the Zeebweeble']], "Basically, we just run around in ellipses trying not to die.")
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-Defeat the super scary awful zombie boss Gnashable the Zeebweeble']], "Oct 21 12:34pm") # start time
driver.ExpectContains([[By.NAME, 'missions-card'], [By.NAME, 'mission-controls-Defeat the super scary awful zombie boss Gnashable the Zeebweeble']], "May 3 11:16pm") # end time

driver.Quit()

