import random
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
from selenium.webdriver.common.by import By


class SimpleDriver:
  def __init__(self, selenium_driver):
    self.selenium_driver = selenium_driver

  def FindElement(self, path, should_exist=True):
    element = None
    for step in path:
      by, locator = step
      try:
        if element is None:
          element = self.selenium_driver.find_element(by, locator)
        else:
          element = element.find_element(by, locator)
      except NoSuchElementException:
        element = None
      if element is None:
        break
    if should_exist:
      assert element is not None
    else:
      assert element is None
    return element

  def Click(self, path):
    self.FindElement(path).click()

  def SendKeys(self, path, keys):
    self.FindElement(path).send_keys(keys)

  def ExpectContains(self, path, needle):
    element = self.FindElement(path)
    # There's four ways to get the contents of an element:
    # print 'el text is "%s" "%s" "%s" "%s"' % (
    #     element.text.strip(),
    #     element.get_attribute('textContent').strip(),
    #     element.get_attribute('innerText').strip(),
    #     element.get_attribute('innerHTML').strip())
    # Sometimes some of them work and others don't.
    # TODO: Figure out why elemene.text doesn't work sometimes when others do
    text = (
        element.text.strip() or
        element.get_attribute('textContent').strip() or
        element.get_attribute('innerText').strip())
    # print 'Checking if "%s" is in "%s"' % (needle, text)
    print 'Checking if "%s" is present.' % (needle)
    # Leaving innerHTML out because it seems like it can have a lot of false
    # positives, because who knows whats in the html...
    if needle not in text:
      raise AssertionError('Element doesnt contain text: %s' % needle)

  def Quit(self):
    self.selenium_driver.quit()


class RetryingDriver:
  def __init__(self, inner_driver):
    self.inner_driver = inner_driver

  def FindElement(self, path, wait_long=False, should_exist=True):
    return self.Retry(lambda: self.inner_driver.FindElement(path, should_exist=should_exist), wait_long=wait_long)

  def Click(self, path):
    return self.Retry(lambda: self.inner_driver.Click(path))

  def SendKeys(self, path, keys):
    return self.Retry(lambda: self.inner_driver.SendKeys(path, keys))

  def ExpectContains(self, path, needle):
    return self.Retry(lambda: self.inner_driver.ExpectContains(path, needle))

  def Quit(self):
    self.inner_driver.Quit()

  def Retry(self, callback, wait_long = False):
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



class ProdDriver:
  def __init__(self, env, password, populate, user, page):
    self.drivers_by_user = {}
    self.env = env
    self.password = password
    self.current_user = None
    self.game_id = 'game-webdriver-%d' % random.randint(0, 2**52)
    if populate:
      self.MakeDriver('zella', 'createPopulatedGame')
      self.SendKeys([[By.NAME, 'populateGameId']], self.game_id)
      self.Click([[By.NAME, 'populate']])
      self.ExpectContains([[By.NAME, 'populateResult']], 'Success!')
    self.SwitchUser(user, page)

  def SwitchUser(self, user, page):
    if user not in self.drivers_by_user:
      self.MakeDriver(user, 'game/' + self.game_id[len('game-'):] + '/' + page)
    else:
      self.current_user = user

  def MakeDriver(self, user, page):
    selenium_driver = webdriver.Chrome()
    url = "http://localhost:5000/%s?user=%s&env=%s&signInMethod=email&email=%s&password=%s" % (page, user, self.env, 'hvz' + user + '@gmail.com', self.password)
    selenium_driver.get(url)

    simple_driver = SimpleDriver(selenium_driver)
    retrying_driver = RetryingDriver(simple_driver)

    self.current_user = user
    self.drivers_by_user[user] = retrying_driver

    self.FindElement([[By.ID, 'root']], wait_long=True)

    self.Click([[By.NAME, 'signIn']])

    self.FindElement([[By.ID, 'root']], wait_long=True)

  def FindElement(self, path, wait_long=False, should_exist=True):
    self.drivers_by_user[self.current_user].FindElement(path, wait_long=wait_long, should_exist=should_exist)

  def Click(self, path):
    self.drivers_by_user[self.current_user].Click(path)

  def ExpectContains(self, path, needle):
    self.drivers_by_user[self.current_user].ExpectContains(path, needle)

  def SendKeys(self, path, keys):
    self.drivers_by_user[self.current_user].SendKeys(path, keys)

  def Quit(self):
    for driver in self.drivers_by_user.values():
      driver.Quit()

class FakeDriver:
  def __init__(self, populate, user, page):
    selenium_driver = webdriver.Chrome()
    url = "http://localhost:5000/%s?user=%s&env=fake" % (page, user)
    if not populate:
      url = url + '&populate=none'
    selenium_driver.get(url)

    simple_driver = SimpleDriver(selenium_driver)
    retrying_driver = RetryingDriver(simple_driver)
    self.inner_driver = retrying_driver

    self.FindElement([[By.ID, 'root']], wait_long=True, scoped=False)

    self.current_user = user

  def SwitchUser(self, user):
    self.current_user = user
    self.Click([[By.ID, user + 'Button']], scoped=False)
    self.FindElement([[By.ID, user + 'App']], scoped=False)

  def FindElement(self, path, wait_long = False, scoped = True, should_exist=True):
    if scoped:
      self.inner_driver.FindElement([[By.ID, self.current_user + "App"]] + path, wait_long, should_exist)
    else:
      self.inner_driver.FindElement(path, wait_long, should_exist)

  def Click(self, path, scoped = True):
    if scoped:
      self.inner_driver.Click([[By.ID, self.current_user + "App"]] + path)
    else:
      self.inner_driver.Click(path)

  def SendKeys(self, path, keys, scoped = True):
    if scoped:
      self.inner_driver.SendKeys([[By.ID, self.current_user + "App"]] + path, keys)
    else:
      self.inner_driver.SendKeys(path, keys)

  def ExpectContains(self, path, needle, scoped = True):
    if scoped:
      self.inner_driver.ExpectContains([[By.ID, self.current_user + "App"]] + path, needle)
    else:
      self.inner_driver.ExpectContains(path, needle)

  def Quit(self):
    self.inner_driver.Quit()


class WholeDriver:
  def __init__(self, user = "zella", page = "", populate = True, env = "fake", password = None):
    self.env = env
    self.password = password
    self.populate = populate

    if env == "localprod" or env == "prod":
      self.inner_driver = ProdDriver(env, password, populate, user, page)
    else:
      self.inner_driver = FakeDriver(populate, user, page)

  def Quit(self):
    self.inner_driver.Quit()

  def SwitchUser(self, user):
    return self.inner_driver.SwitchUser(user)

  def FindElement(self, path, wait_long = False, should_exist=True):
    return self.inner_driver.FindElement(path, wait_long, should_exist=should_exist)

  def DontFindElement(self, path, wait_long = False):
    return self.FindElement(path, wait_long=wait_long, should_exist=False)

  def Click(self, path):
    return self.inner_driver.Click(path)

  def SendKeys(self, path, keys):
    return self.inner_driver.SendKeys(path, keys)

  def ExpectContains(self, path, needle):
    return self.inner_driver.ExpectContains(path, needle)

  # def FindElement(self, by, locator, wait_long=True):
  #   return Element(driver, FindElement(self.driver, by, locator, container = self.element, wait_long = wait_long))
