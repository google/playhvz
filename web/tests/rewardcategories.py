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
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "http://www.google.com")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A way to show off to your friends how much you love eating humans.")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Verify that it shows up
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Lord Gnasher the Hungry Reward for Ravenous Zombies')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Gnasher')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], '2')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'http://www.google.com')

  # Edit the category
  driver.Click([[By.NAME, 'row-Gnasher'], [By.ID, 'menu']])
  driver.Click([[By.NAME, 'row-Gnasher'], [By.NAME, 'menu-item-Edit']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Good Flosser Badge")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Flosser")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "3")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "900")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A reward you get for brushing and flossing after eating humans.")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Generate 200 rewards.
  driver.Click([[By.NAME, 'row-Gnasher'], [By.ID, 'menu']])
  driver.Click([[By.ID, 'row-Gnasher'], [By.NAME, 'menu-item-Show Reward']])
  driver.SendKeys([[By.ID, 'newReward']], "22")

  # Check that the rewards show up

  

  # # Export 200 rewards.
  # driver.Click([[By.NAME, 'row-Gnasher'], [By.ID, 'menu']])
  # driver.Click([[By.ID, 'row-Gnasher'], [By.NAME, 'menu-item-Export Reward']])

finally:
  pass