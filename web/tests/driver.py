
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
from selenium.webdriver.common.by import By

def FindElement(driver, path):
  element = None
  for step in path:
    by, locator = step
    if element is None:
      element = driver.find_element(by, locator)
    else:
      element = element.find_element(by, locator)
    assert element is not None
  assert element is not None
  return element

def Retry(callback, wait_long = False):
  sleep_durations = [.5, .5, .5, .5, 1, 1]
  if wait_long:
    sleep_durations = [1, 1, 1, 1, 1, 1, 2, 4, 8]
  for i in range(0, len(sleep_durations) + 1):
    try:
      return callback()
    except (NoSuchElementException, AssertionError, WebDriverException) as e:
      if i == len(sleep_durations):
        raise e
      else:
        time.sleep(sleep_durations[i])


class RetryingDriver:
  def __init__(self, user = "zella", page = "", populate = True):
    self.driver = webdriver.Chrome()
    self.user = user
    url = "http://localhost:5000/%s?user=%s" % (page, user)
    if not populate:
      url = url + '&populate=none'
    self.driver.get(url)

    self.FindElementInner([[By.ID, 'root']], wait_long=True)

  def FindElementInner(self, path, wait_long = False):
    return Retry(
        lambda: FindElement(self.driver, path),
        wait_long=wait_long)

  def ClickInner(self, path):
    return Retry(lambda: self.FindElementInner(path).click())

  def SwitchUser(self, user):
    self.user = user
    self.ClickInner([[By.ID, user + 'Button']])
    self.FindElementInner([[By.ID, user + 'App']])

  def FindElement(self, path, wait_long = False):
    return self.FindElementInner(
        [[By.ID, self.user + "App"]] + path,
        wait_long)

  def Click(self, path):
    return self.ClickInner([[By.ID, self.user + "App"]] + path)

  def SendKeys(self, path, keys):
    return Retry(lambda: self.FindElement(path).send_keys(keys))

  def ExpectContainsInner(self, path, needle):
    element = self.FindElement(path)
    if needle not in element.text:
      raise AssertionError('Element doesnt contain text: %s' % needle)

  def ExpectContains(self, path, needle):
    return Retry(lambda: self.ExpectContainsInner(path, needle))

  def Quit(self):
    self.driver.quit()

  # def FindElement(self, by, locator, wait_long=True):
  #   return Element(driver, FindElement(self.driver, by, locator, container = self.element, wait_long = wait_long))
