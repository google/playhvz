#!/usr/bin/python
#
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""TODO: High-level file comment."""

import random
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement

class SimpleDriver:
  def __init__(self, selenium_driver):
    self.selenium_driver = selenium_driver

  def FindElement(self, path, should_exist=True, check_visible=True):
    element = None
    for step in path:
      by, locator = step
      if element is None:
        elements = self.selenium_driver.find_elements(by, locator)
      else:
        elements = element.find_elements(by, locator)
      # assert len(elements) < 2, "Multiple elements found!"
      element = elements[0] if len(elements) > 0 else None
      if element is None:
        break
    if should_exist:
      assert element is not None, "Element %s doesn't exist!" % path
      if check_visible:
        assert element.is_displayed(), "Element %s isn't visible" % path
    else:
      if check_visible:
        assert (element is None or not element.is_displayed()), "Element %s exists!" % path
      else:
        assert element is None, "Element %s exists!" % path
    return element

  def Click(self, path):
    element = self.FindElement(path, check_visible=False)
    assert element.is_enabled(), "Element %s isn't enabled" % path
    element.click()

  def SendKeys(self, path, keys):
    self.FindElement(path).send_keys(keys)

  def Backspace(self, path, number):
    for i in range(number):
      self.FindElement(path).send_keys(Keys.BACKSPACE)

  def Clear(self, path):
    self.FindElement(path).clear() 

  def DismissAlert(self, textToLookFor = ''):
    someAlert = self.selenium_driver.switch_to_alert()
    if (textToLookFor != ''):
      assert(textToLookFor == someAlert.text)
    someAlert.accept();

  def ExpectAttributeEqual(self, path, attribute_name, value, wait_long=True):
    element = self.FindElement(path)
    assert(element is not None)
    attribute_value = element.get_attribute(attribute_name)
    assert(attribute_value == value), "The found attribute %s does not match value %s for attribute %s of %s" % (attribute_value, value, attribute_name, path)

  def ExpectContains(self, path, needle, should_exist=True, check_visible=True):
    element = self.FindElement(path, check_visible=check_visible)
    # There's four ways to get the contents of an element:
    # print 'el text is "%s" "%s" "%s" "%s"' % (
    #     element.text.strip(),
    #     element.get_attribute('textContent').strip(),
    #     element.get_attribute('innerText').strip(),
    #     element.get_attribute('innerHTML').strip())
    # Sometimes some of them work and others don't.
    # TODO: Figure out why element.text doesn't work sometimes when others do
    text = (
        element.text.strip() or
        element.get_attribute('textContent').strip() or
        element.get_attribute('innerText').strip())
    # print 'Checking if "%s" is in "%s"' % (needle, text)
    # Leaving innerHTML out because it seems like it can have a lot of false
    # positives, because who knows whats in the html...
    if should_exist:
      assert needle in text, "The text %s was not found in %s" % (needle, path)
      ## assert element.is_displayed(), "The text %s is not visible"  % needle
    else:
      assert (needle not in text), "The text %s was found when it wasn't supposed be there." % needle

  def Quit(self):
    self.selenium_driver.quit()


class RetryingDriver:
  def __init__(self, inner_driver):
    self.inner_driver = inner_driver

  def FindElement(self, path, wait_long=True, should_exist=True, check_visible=True):
    return self.Retry(lambda: self.inner_driver.FindElement(
      path,
      should_exist=should_exist,
      check_visible=check_visible),
      wait_long=wait_long)

  def Click(self, path):
    return self.Retry(lambda: self.inner_driver.Click(path), wait_long=True)

  def DismissAlert(self, textToLookFor = ''):
    return self.Retry(lambda: self.inner_driver.DismissAlert(textToLookFor))

  def SendKeys(self, path, keys):
    return self.Retry(lambda: self.inner_driver.SendKeys(path, keys))

  def Backspace(self, path, number):
    return self.Retry(lambda: self.inner_driver.Backspace(path, number))

  def Clear(self, path):
    return self.Retry(lambda: self.inner_driver.Clear(path))

  def ExpectContains(self, path, needle, should_exist=True, check_visible=True):
    return self.Retry(lambda: self.inner_driver.ExpectContains(path, needle, should_exist=should_exist, check_visible=check_visible))

  def ExpectAttributeEqual(self, path, attribute_name, value, wait_long=True):
    return self.Retry(lambda: self.inner_driver.ExpectAttributeEqual(path, attribute_name, value), wait_long=wait_long)

  def Quit(self):
    self.inner_driver.Quit()

  def Retry(self, callback, wait_long=True):
    sleep_durations = [.5, .5, .5, .5, 1, 1]
    if wait_long:
      sleep_durations = [1, 1, 1, 1, 1, 1, 2, 4, 8, 16, 32, 64]
    for i in range(0, len(sleep_durations) + 1):
      print ("sleep: ", sleep_durations[i-1])
      try:
        return callback()
      except (NoSuchElementException, AssertionError, WebDriverException, ElementNotVisibleException) as e:
        if i == len(sleep_durations):
          raise e
        else:
          time.sleep(sleep_durations[i])


class RemoteDriver:
  # To get a non-game-subpage, start page with /
  # See creategame.py for an example
  def __init__(self, client_url, is_mobile, password, populate, user, page):
    self.is_mobile = is_mobile
    self.client_url = client_url
    self.drivers_by_user = {}
    self.password = password
    self.current_user = None
    self.game_id = 'game-webdriver-%d' % random.randint(0, 2**52)
    if populate:
      self.MakeDriver('zella', 'createPopulatedGame')
      self.Click([[By.ID, 'createPopulatedGame']])
      self.SendKeys(
          [[By.ID, 'idInput'], [By.TAG_NAME, 'input']],
          self.game_id)
      self.Click([[By.ID, 'gameForm'], [By.ID, 'done']])
    self.SwitchUser(user, page)

  def SwitchUser(self, user, page=""):
    if user not in self.drivers_by_user:
      if len(page) and page[0] == '/':
        page = page[1:]
      else:
        page = 'game/' + self.game_id[len('game-'):] + '/' + page
      self.MakeDriver(user, page)
    else:
      self.current_user = user

  def GetGameId(self):
    return self.game_id

  def MakeDriver(self, user, page):
    url = "%s/%s?bridge=remote&signInMethod=email&email=%s&password=%s&layout=%s&logrequests=1" % (
        self.client_url,
        page,
        user + '@playhvz.com',
        self.password,
        'mobile' if self.is_mobile else 'desktop')

    selenium_driver = webdriver.Chrome()
    if self.is_mobile:
      selenium_driver.set_window_size(480, 640);
    selenium_driver.get(url)

    simple_driver = SimpleDriver(selenium_driver)
    retrying_driver = RetryingDriver(simple_driver)

    self.current_user = user
    self.drivers_by_user[user] = retrying_driver

    self.FindElement([[By.ID, 'root']], wait_long=True)
    self.ExpectAttributeEqual([[By.ID, 'realApp']], 'signed-in', 'true', wait_long=True)

  def FindElement(self, path, wait_long=True, should_exist=True, check_visible=True):
    return self.drivers_by_user[self.current_user].FindElement(path, wait_long=wait_long, should_exist=should_exist, check_visible=check_visible)

  def Click(self, path, scoped=False):
    self.drivers_by_user[self.current_user].Click(path)

  def DismissAlert(self, textToLookFor = ''):
    self.drivers_by_user[self.current_user].DismissAlert(textToLookFor)

  def ExpectContains(self, path, needle, should_exist=True, check_visible=True, scoped=True):
    self.drivers_by_user[self.current_user].ExpectContains(path, needle, should_exist=should_exist, check_visible=check_visible)

  def SendKeys(self, path, keys):
    self.drivers_by_user[self.current_user].SendKeys(path, keys)

  def ExpectAttributeEqual(self, path, attribute_name, value, wait_long=True):
    self.drivers_by_user[self.current_user].ExpectAttributeEqual(path, attribute_name, value, wait_long)

  def Backspace(self, path, number):
    self.drivers_by_user[self.current_user].Backspace(path, number)

  def Clear(self, path):
    self.drivers_by_user[self.current_user].Clear(path)

  def Quit(self):
    for driver in self.drivers_by_user.values():
      driver.Quit()

class FakeDriver:
  def __init__(self, client_url, is_mobile, populate, user, page):
    selenium_driver = webdriver.Chrome()
    if is_mobile:
      selenium_driver.set_window_size(480, 640);

    if len(page) == 0:
       page = '/game/poptest-1'
    if page and len(page) and page[0] == '/':
      page = page[1:]

    url = "%s/%s?user=%s&bridge=fake&layout=%s&logrequests=1" % (
        client_url,
        page,
        user,
        'mobile' if is_mobile else 'desktop')
    if not populate:
      url = url + '&populate=none'
    selenium_driver.get(url)

    simple_driver = SimpleDriver(selenium_driver)
    retrying_driver = RetryingDriver(simple_driver)
    self.inner_driver = retrying_driver

    self.FindElement([[By.ID, 'root']], wait_long=True, scoped=False)

    self.current_user = user

  def GetGameId(self):
    return "poptest-1" # This is the ID that fake-app.html makes for its fake game

  def SwitchUser(self, user):
    self.current_user = user
    self.Click([[By.ID, user + 'Button']], scoped=False)
    self.FindElement([[By.ID, user + 'App']], scoped=False)

  def FindElement(self, path, wait_long=True, scoped=True, should_exist=True, check_visible=True):
    if scoped:
      return self.inner_driver.FindElement([[By.ID, self.current_user + "App"]] + path, wait_long, should_exist, check_visible)
    else:
      return self.inner_driver.FindElement(path, wait_long, should_exist, check_visible)

  def Click(self, path, scoped=True):
    if scoped:
      self.inner_driver.Click([[By.ID, self.current_user + "App"]] + path)
    else:
      self.inner_driver.Click(path)

  def DismissAlert(self, textToLookFor = ''):
    self.inner_driver.DismissAlert(textToLookFor)

  def SendKeys(self, path, keys, scoped=True):
    if scoped:
      self.inner_driver.SendKeys([[By.ID, self.current_user + "App"]] + path, keys)
    else:
      self.inner_driver.SendKeys(path, keys)

  def Backspace(self, path, number, scoped=True):
    if scoped:
      self.inner_driver.Backspace([[By.ID, self.current_user + "App"]] + path, number)
    else:
      self.inner_driver.Backspace(path, number)

  def Clear(self, path, scoped=True):
    if scoped:
      self.inner_driver.Clear([[By.ID, self.current_user + "App"]] + path)
    else:
      self.inner_driver.Clear(path)

  def ExpectContains(self, path, needle, scoped=True, should_exist=True, check_visible=True):
    if scoped:
      self.inner_driver.ExpectContains([[By.ID, self.current_user + "App"]] + path, needle, should_exist=should_exist, check_visible=check_visible)
    else:
      self.inner_driver.ExpectContains(path, needle, should_exist=should_exist, check_visible=check_visible)

  def ExpectAttributeEqual(self, path, attribute_name, value, scoped=True, wait_long=True):
    if scoped:
      self.inner_driver.ExpectAttributeEqual([[By.ID, self.current_user + "App"]] + path, attribute_name, value)
    else:
      self.inner_driver.ExpectAttributeEqual(path, attribute_name, value)

  def Quit(self):
    self.inner_driver.Quit()


class WholeDriver:
  def __init__(self, client_url, is_mobile, use_remote, use_dashboards, user, password, page, populate):
    self.is_mobile = is_mobile
    self.use_remote = use_remote
    if use_remote:
      self.inner_driver = RemoteDriver(client_url, is_mobile, password, populate, user, page)
    else:
      self.inner_driver = FakeDriver(client_url, is_mobile, populate, user, page)

  def WaitForGameLoaded(self):
    self.FindElement([[By.NAME, "gameLoaded"]], wait_long=True, check_visible=False)

  def GetGameId(self):
    return self.inner_driver.GetGameId()

  def Quit(self):
    self.inner_driver.Quit()
    print "done"

  def SwitchUser(self, user):
    return self.inner_driver.SwitchUser(user)

  def FindElement(self, path, wait_long=True, should_exist=True, check_visible=True):
    return self.inner_driver.FindElement(path, wait_long, should_exist=should_exist, check_visible=check_visible)

  def DontFindElement(self, path, wait_long=True, check_visible=True):
    return self.FindElement(path, wait_long=wait_long, should_exist=False)

  def Click(self, path, scoped=True):
    return self.inner_driver.Click(path, scoped)

  def DismissAlert(self, textToLookFor = '', native=False):
    if native:
      return self.inner_driver.DismissAlert(textToLookFor)
    else:
      if textToLookFor:
        self.ExpectContains([[By.ID, 'alertContents']], textToLookFor, scoped=False)
      self.Click([[By.ID, 'alertDismiss']], scoped=False)

  def SendKeys(self, path, keys):
    return self.inner_driver.SendKeys(path, keys)

  def Backspace(self, path, number=1):
    return self.inner_driver.Backspace(path, number)

  def Clear(self, path):
    return self.inner_driver.Clear(path)

  def ExpectContains(self, path, needle, should_exist=True, check_visible=True, scoped=True):
    return self.inner_driver.ExpectContains(path, needle, should_exist=should_exist, check_visible=check_visible, scoped=scoped)

  def ExpectAttributeEqual(self, path, attribute_name, value, wait_long=True):
    return self.inner_driver.ExpectAttributeEqual(path, attribute_name, value, wait_long)

  def RetryUntil(self, action, result, num_times=4):
    for i in range(num_times):
      try:
        action()
        return result()
      except (NoSuchElementException, AssertionError, WebDriverException, ElementNotVisibleException) as e:
        if i == num_times - 1:
          raise e
        else:
          time.sleep(0.5)
          print("A retry action failed %d times" % (i + 1))

  def DrawerMenuClick(self, currPage, destinationPage):
    if self.is_mobile:
      self.RetryUntil(
        lambda: self.Click([[By.NAME, currPage], [By.NAME, 'drawerButton']]),
        lambda: self.FindElement([[By.NAME, 'drawer%s' % destinationPage]]))
    self.Click([[By.NAME, 'drawer%s' % destinationPage]])

  def TableMenuClick(self, pathToRow, buttonName):
    self.RetryUntil(
      lambda: self.Click(pathToRow + [[By.ID, 'menu']]),
      lambda: self.FindElement(pathToRow + [[By.NAME, 'menu-item-%s' % buttonName]]))
    self.Click(pathToRow + [[By.NAME, 'menu-item-%s' % buttonName]])
