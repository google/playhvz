import sys
from driver import WholeDriver

from selenium.webdriver.common.by import By

try:
  driver = WholeDriver(
      user="jack",
      env=sys.argv[1],
      password=sys.argv[2])

  driver.FindElement([[By.NAME, 'ChatRoom: Resistance Comms Hub']])

  driver.SwitchUser("drake")

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')

  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')

  driver.Click([[By.ID, 'infect']])

  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'Jack Slayer the Bean Slasher')

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '202')

  driver.SwitchUser("jack")

  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']])
  
  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.Quit()

finally:
  # driver.Quit()
  pass
