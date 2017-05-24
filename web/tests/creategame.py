import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

def InnerFindOnElementById(id):
  input_element = driver.find_element_by_id(id)

def FindElementById(id):
  sleep_durations = [1, 1, 1, 1, 1, 1, 2, 4, 8]
  for i in range(0, len(sleep_durations) + 1):
    try:
      input_element = InnerFindOnElementById(id)
      return input_element
    except NoSuchElementException:
      if i == len(sleep_durations):
        raise 'Dangit'
      else:
        time.sleep(sleep_durations[i])

def ClickOnElementById(id):
  element = FindElementById(id)
  element.click()
  return element

# Create a new instance of the Firefox driver
driver = webdriver.Firefox()

# go to the google home page
driver.get("http://localhost:5000/createGame?user=minny&populate=none")

ClickOnElementById('createGame')

id_field = ClickOnElementById('idField')

id_field.find_element_by_tag_name('input').send_keys('my game')

time.sleep(5)



try:
  pass
    # # we have to wait for the page to refresh, the last thing that seems to be updated is the title
    # WebDriverWait(driver, 10).until(EC.title_contains("cheese!"))

    # # You should see "cheese! - Google Search"
    # print driver.title

finally:
    driver.quit()