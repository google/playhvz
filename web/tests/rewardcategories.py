import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

driver.Click([[By.NAME, 'close-notification']])

try:
  # Go to the admin rewards section
  if driver.is_mobile:
    driver.Click([[By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerAdmin Rewards']])
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'add']])

  # Make reward category.
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Lord Gnasher the Hungry Reward for Ravenous Zombies")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Gnasher")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "gn")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Verify that it shows up
   


  # Edit it, change it to three.
  # Set its badge to something cool.
  # Generate 200 rewards.
  # Export 200 rewards.

  #driver.Quit()

finally:
  pass