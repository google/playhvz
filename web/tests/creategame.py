from driver import RetryingDriver

from selenium.webdriver.common.by import By

try:
  driver = RetryingDriver("http://localhost:5000/createGame?user=minny&populate=none")

  # ID
  # XPATH
  # LINK_TEXT
  # PARTIAL_LINK_TEXT
  # NAME
  # TAG_NAME
  # CLASS_NAME
  # CSS_SELECTOR

  driver.Click([[By.ID, 'createGame']])

  driver.SendKeys(
      [[By.ID, 'idInput'], [By.TAG_NAME, 'input']],
      'mygame')

  driver.SendKeys(
      [[By.ID, 'nameInput'], [By.TAG_NAME, 'input']],
      'My Game')

  driver.SendKeys(
      [[By.ID, 'stunTimerInput'], [By.TAG_NAME, 'input']],
      '60')
  
  driver.Click([[By.ID, 'gameForm'], [By.ID, 'done']])

  driver.ExpectContains(
      [[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'name']],
      'My Game')

  driver.ExpectContains(
      [[By.TAG_NAME, 'ghvz-game-details'], [By.ID, 'stunTimer']],
      '60')

finally:
  # driver.Quit()
  pass
