from driver import RetryingDriver

# from selenium import webdriver
# from selenium.common.exceptions import TimeoutException
# from selenium.common.exceptions import NoSuchElementException
# from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
# from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
from selenium.webdriver.common.by import By

try:
  driver = RetryingDriver()

  driver.FindElement([[By.ID, 'root']], wait_long=True)
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
