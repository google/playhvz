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
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Lord Gnasher the Hungry Reward")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Gnasher")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "2")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "google.com")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "Show off how much you love eating humans!")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Verify that it shows up
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Lord Gnasher the Hungry Reward')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'Gnasher')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], '2')
  driver.ExpectContains([[By.NAME, 'row-Gnasher']], 'google.com')

  # Edit the category
  driver.Click([[By.NAME, 'row-Gnasher'], [By.ID, 'menu']])
  driver.Click([[By.NAME, 'row-Gnasher'], [By.NAME, 'menu-item-Edit']])
  driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], 30)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Good Flosser Badge")
  driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], 7)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Flosser")
  driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], 1)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "3")
  driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], 1)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "900")
  driver.Backspace([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], 10)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png")
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], 41)
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A reward you get for brushing and flossing after eating humans.")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Generate 22 rewards.
  driver.Click([[By.NAME, 'row-Flosser'], [By.ID, 'menu']])
  driver.Click([[By.ID, 'row-Flosser'], [By.NAME, 'menu-item-Show Rewards']])
  driver.SendKeys([[By.ID, 'newReward']], "22")

  # Check that at least one shows up #TODO(aliengirl) - is there a better way to do this?
  driver.ExpectContains([[By.NAME, 'rewardsTable']], '(unclaimed)')

  # Export the rewards.
  driver.Click([[By.NAME, 'row-Flosser'], [By.ID, 'menu']])
  driver.Click([[By.ID, 'row-Flosser'], [By.NAME, 'menu-item-Export Reward']])

finally:
  pass