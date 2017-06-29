import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="jack")

try:

  # Make sure Jack starts out human
  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerChat']])

  driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Resistance Comms Hub')

  # Drake infects Jack
  driver.SwitchUser("drake")

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'profile-card'], [By.NAME, 'drawerButton']])
  
  driver.Click([[By.NAME, 'drawerDashboard']]) # Crashed here once (mobile)

  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly') # Crashed here once (desktop)

  driver.Click([[By.ID, 'infect']])

  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'JackSlayerTheBeanSlasher')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  # Check that Drake has been given points for the kill
  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '202')

  # See that Jack is now a zombie
  driver.SwitchUser("jack")

  driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], 'Horde ZedLink')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawerDashboard']])


  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])


  #driver.Quit()

finally:
  # driver.Quit()
  pass
