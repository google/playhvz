import setup
from selenium.webdriver.common.by import By
import time


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

  driver.SendKeys([[By.ID, 'form-section-mission-name'],[By.TAG_NAME, 'input']], name)

  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']], startYear)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']], startMonth)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']], startDay)
  driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 6)
  driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']], startTime)

  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], endYear)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']], endMonth)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], endDay)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 6)
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

try:

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerAdmin Missions']])

  driver.Click([[By.NAME, 'close-notification']])


  # Delete the two missions which start out there 
  driver.Click([[By.NAME, "mission-row-first zed mission!"], [By.ID, 'menu']])
  driver.Click([[By.NAME, "mission-row-first zed mission!"], [By.NAME, 'menu-item-Delete']])
  
  driver.Click([[By.NAME, "mission-row-first human mission!"], [By.ID, 'menu']]) # TODO(aliengirl): figure out why menu doesn't always open here
  driver.Click([[By.NAME, "mission-row-first human mission!"], [By.NAME, 'menu-item-Delete']])


  # Make sure both humans and zombies get a default message when no missions are posted.
  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerDashboard']])
  driver.ExpectContains([[By.NAME, 'next-mission-box']], "The next mission's details will be posted here.")

  driver.SwitchUser('zeke') # He's a zombie
  driver.ExpectContains([[By.NAME, 'next-mission-box']], "The next mission's details will be posted here.")

  # Log back in as an admin.
  driver.SwitchUser('zella')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerAdmin Missions']])

  # Make sure both humans and zombies get a default message when no missions are posted. #TODO(aliengirl): Do this!!!

  # Log back in as an admin.

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

  # Log in as a human (Jack), make sure he can see the human mission
  driver.SwitchUser('jack')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.ExpectContains([[By.NAME, 'next-mission-box']], 'take over the world')
  
  # Log in as a zombie (Zeke), make sure he can see the zombie mission
  driver.SwitchUser('zeke')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.ExpectContains([[By.NAME, 'next-mission-box']], 'eat humans')

  # TODO - ONCE IMPLEMENTED... 
  # As an admin, create a mission for humans who RSVP'd to the mission
  driver.SwitchUser('zella')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerAdmin Missions']])

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

  # As far as I can tell, the only way to assign a mission to the rsvpers for it is to edit it.

  # driver.Click([[By.NAME, 'mission-row-Defeat the dread zombie boss Gnashable the Zeebweeble'], [By.ID, 'menu']])
  # driver.Click([[By.NAME, 'mission-row-Defeat the dread zombie boss Gnashable the Zeebweeble'], [By.NAME, 'menu-item-Edit']])

  # insertAndVerifyMissionInfo(
  #   name='Defeat the dread zombie boss Gnashable the Zeebweeble',
  #   startYear='2017',
  #   startMonth='9',
  #   startDay='20',
  #   startTime='3:00am',
  #   endYear='2038',
  #   endMonth='4',
  #   endDay='2',
  #   endTime='10:15pm',
  #   details='<div>Basically, we just run around in circles trying not to die.</div>',
  #   groupName='Rsvpers for Defeat the dread zombie boss Gnashable the Zeebweeble')

  # (WHEN IMPLEMENTED... )
  # Have Jack RSVP, see that the mission only appears after he RSVPs
  driver.SwitchUser('jack')
  driver.ExpectContains([[By.NAME, 'next-mission-box']], 'Basically, we just run around in circles trying not to die.')

  # As an admin, change the mission end date to later than the other human mission
  driver.SwitchUser('zella')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerAdmin Missions']])

  driver.Click([[By.NAME, 'mission-row-Defeat the dread zombie boss Gnashable the Zeebweeble'], [By.ID, 'menu']])
  driver.Click([[By.NAME, 'mission-row-Defeat the dread zombie boss Gnashable the Zeebweeble'], [By.NAME, 'menu-item-Edit']])

  insertAndVerifyMissionInfo(
    name='Defeat the dread zombie boss Gnashable the Zeebweeble',
    startYear='2017',
    startMonth='9',
    startDay='20',
    startTime='3:00am',
    endYear='2039',
    endMonth='4',
    endDay='2',
    endTime='10:15pm',
    details='<div>Basically, we just run around in circles trying not to die.</div>',
    groupName='Everyone')

  # Log in as a human (Jack). Show that the new mission doesn't show up anymore
  driver.SwitchUser('jack')
  driver.ExpectContains([[By.NAME, 'next-mission-box']], 'take over the world')


  
  driver.Quit()

finally:
  pass



