import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
from selenium.webdriver.common.by import By

def InnerFindElement(driver, by, locator, container):
  if container is None:
    return driver.find_element(by, locator)
  else:
    return container.find_element(by, locator)

def FindElement(driver, by, locator, container = None, wait_long = False):
  sleep_durations = [.5, .5, .5, .5, 1, 1]
  if wait_long:
    sleep_durations = [1, 1, 1, 1, 1, 1, 2, 4, 8]
  for i in range(0, len(sleep_durations) + 1):
    print 'Trying to find element id %s, attempt %d' % (locator, i)
    try:
      input_element = InnerFindElement(driver, by, locator, container)
      if input_element is None:
        raise NoSuchElementException('Found no element by id "%s"' % id)
      return input_element
    except NoSuchElementException:
      if i == len(sleep_durations):
        raise NoSuchElementException('Found no element by id "%s"' % id)
      else:
        time.sleep(sleep_durations[i])


class Driver:
  def __init__(self, driver):
    self.driver = driver

  def FindElement(self, by, locator, wait_long=True):
    return Element(self.driver, FindElement(self.driver, by, locator, wait_long = wait_long))

  def Quit(self):
    self.driver.quit()

class Element:
  def __init__(self, driver, element):
    self.driver = driver
    self.element = element

  def FindElement(self, by, locator, wait_long=True):
    return Element(driver, FindElement(self.driver, by, locator, container = self.element, wait_long = wait_long))

  def Click(self):
    self.element.click()

  def SendKeys(self, keys):
    self.element.send_keys(keys)


# Create a new instance of the Firefox driver
driver = webdriver.Chrome()

try:
  # go to the google home page
  driver.get("http://localhost:5000/createGame?user=minny&populate=none")

  driver = Driver(driver)

  driver.FindElement(By.ID, 'root', wait_long=True)
  # ID
  # XPATH
  # LINK_TEXT
  # PARTIAL_LINK_TEXT
  # NAME
  # TAG_NAME
  # CLASS_NAME
  # CSS_SELECTOR

  driver.FindElement(By.ID, 'createGame').Click()

  (driver.FindElement(By.ID, 'idInput')
      .FindElement(By.TAG_NAME, 'input')
      .SendKeys('mygame'))

  (driver.FindElement(By.ID, 'nameInput')
      .FindElement(By.TAG_NAME, 'input')
      .SendKeys('My Game'))

  (driver.FindElement(By.ID, 'stunTimerInput')
      .FindElement(By.TAG_NAME, 'input')
      .SendKeys('60'))

  (driver.FindElement(By.ID, 'rulesHtmlInput')
      .FindElement(By.TAG_NAME, 'textarea')
      .SendKeys('<i>lol</i>'))
  
  (driver.FindElement(By.ID, 'gameForm')
      .FindElement(By.ID, 'done')
      .Click())

  driver.FindElement(By.TAG_NAME, 'ghvz-player-table')

finally:
  # driver.Quit()
  pass
