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
  group,
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
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], startYear)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']], startMonth)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], startDay)
  driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 6)
  driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], startTime)

  driver.SendKeys([[By.ID, 'form-section-mission-details'],[By.TAG_NAME, 'textarea']], details)

  driver.Click([[By.ID, 'form-section-mission-group'], [By.TAG_NAME, 'input']])
  driver.Click([[By.NAME, group]])
  driver.Click([[By.ID, 'missionForm'], [By.ID, 'done']])

  # TODO - insert verify part of this
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionName']], name)
  #driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionGroup']], groupName)
  driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionStart']], startTime)
  #driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionEnd']], endTime)
  #driver.ExpectContains([[By.NAME, 'mission-row-%s' % name], [By.NAME, 'missionDetails']], details)



def viewMissionInfo():
  pass



driver = setup.MakeDriver(user="zella")

try:

  driver.Click([[By.NAME, 'drawerAdmin Missions']])

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
    group='group-resistance-6',
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
    group='group-horde-7',
    groupName='Horde')

  # # Log in as a human (Jack), make sure he can see the human mission
  driver.SwitchUser('jack')
  driver.Click([[By.NAME, 'drawerMissions']])
  #driver.ExpectContains([[By.NAME, 'mission-card']], 'insert witty and entertaining name here')

  # # Log in as a zombie (Deckerd), make sure he can see the zombie mission
  driver.SwitchUser('deckerd')
  driver.Click([[By.NAME, 'drawerMissions']])
  # driver.ExpectContains([[By.NAME, 'mission-card']], 'zed mission')

  # # As an admin, create a mission for humans who RSVP'd to the mission
  driver.SwitchUser('zella')
  driver.Click([[By.NAME, 'drawerAdmin Missions']])
  driver.Click([[By.ID, 'add']])
  insertAndVerifyMissionInfo(
    name='rsvp humans mission',
    startYear='2017',
    startMonth='1',
    startDay='2',
    startTime='12:34am',
    endYear='2038',
    endMonth='4',
    endDay='2',
    endTime='2:34pm',
    details='<div>something cool</div>',
    group='mission-1',
    groupName="rsvpers for first human mission!")

  # Log in as a human (Jack). Show that the new mission doesn't show up until he RSVPs
  driver.SwitchUser('jack')
  driver.Click([[By.NAME, 'drawerMissions']])
  #driver.ExpectContains([[By.NAME, 'mission-card']], 'insert witty and entertaining name here')

  #RSVP

  # As an admin, change the mission end date to later than the other human mission
  driver.SwitchUser('zella')
  driver.Click([[By.NAME, 'drawerAdmin Missions']])
  driver.Click([[By.NAME, 'mission-row-insert witty and entertaining name here'], [By.ID, 'menu']])

  # Log in as a human (Jack). Show that the new mission doesn't show up anymore
  # driver.SwitchUser('jack')
  # driver.Click([[By.NAME, 'drawerMissions']])
  #driver.ExpectContains([[By.NAME, 'mission-card']], 'insert witty and entertaining name here')

  

  ###driver.Quit()



finally:
  pass



