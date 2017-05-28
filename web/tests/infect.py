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

  # driver.Click([[By.ID, 'createGame']])

  # driver.SendKeys(
  #     [[By.ID, 'idInput'], [By.TAG_NAME, 'input']],
  #     'mygame')

  # driver.SendKeys(
  #     [[By.ID, 'nameInput'], [By.TAG_NAME, 'input']],
  #     'My Game')

  # driver.SendKeys(
  #     [[By.ID, 'stunTimerInput'], [By.TAG_NAME, 'input']],
  #     '60')
  
  # driver.Click([[By.ID, 'gameForm'], [By.ID, 'done']])

  # driver.ExpectContains(
  #     [[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'name']],
  #     'My Game')

  # driver.ExpectContains(
  #     [[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'stunTimer']],
  #     '60')

finally:
  # driver.Quit()
  pass
