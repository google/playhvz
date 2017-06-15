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
  group):

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


def viewMissionInfo():
  pass



driver = setup.MakeDriver(user="zella")

try:

  driver.Click([[By.NAME, 'drawerAdmin Missions']])

  # Create a human mission
  driver.Click([[By.ID, 'add']])
  insertAndVerifyMissionInfo(
    name='insert witty and entertaining name here',
    startYear='2012',
    startMonth='10',
    startDay='20',
    startTime='3:00am',
    endYear='2038',
    endMonth='4',
    endDay='2',
    endTime='10:15pm',
    details='<div>take over the world</div>',
    group='group-resistance-6')

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
    group='group-horde-7')

  # Log in as a human (Jack), make sure he can see the human mission
  driver.SwitchUser('jack')
  #TODO - see mission

  # Log in as a zombie (Deckerd), make sure he can see the zombie mission

  # As an admin, create a mission for humans who RSVP'd to the mission
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
    group='mission-1')

  # Log in as a human (Jack). Show that the new mission doesn't show up until he RSVPs

  # As an admin, change the mission end date to later than the other human mission

  # Log in as a human (Jack). Show that the new mission doesn't show up anymore

  

  ###driver.Quit()



finally:
  pass



