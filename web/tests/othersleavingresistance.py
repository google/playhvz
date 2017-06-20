import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="jack")

INFECTABLES = [
 ('Moldavi the Moldavish', 'zooble flipwoogly'),
 ('Jack Slayer the Bean Slasher', 'grobble forgbobbly'),
 ('Zella the Ultimate', 'glarple zerp wobbledob')
]

try:
  driver.FindElement([[By.NAME, 'ChatRoom: Resistance Comms Hub']])

  driver.SwitchUser("drake")

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')

  driver.Click([[By.NAME, 'drawerDashboard']])

  for target in INFECTABLES:
    # only zombies have lifeCodeInput
    driver.SendKeys(
        [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
        target[1])

    driver.Click([[By.ID, 'infect']])

    driver.ExpectContains(
        [[By.NAME, 'victimName']],
        target[0])

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
