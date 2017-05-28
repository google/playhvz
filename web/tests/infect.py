from driver import RetryingDriver

from selenium.webdriver.common.by import By

try:
  driver = RetryingDriver("jack")

  driver.FindElement([[By.NAME, 'ChatRoom: Resistance Comms Hub']])

  driver.SwitchUser("drake")

  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')

  driver.Click([[By.ID, 'infect']])

  driver.ExpectContains(
      [[By.ID, 'victimName']],
      'Jack Slayer the Bean Slasher')

  driver.SwitchUser("jack")

  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']])

finally:
  # driver.Quit()
  pass
