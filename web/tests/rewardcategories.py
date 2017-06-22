import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

driver.SwitchUser('zeke')
driver.SwitchUser('zella')

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
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'nameInput'], [By.TAG_NAME, 'input']], "Good Flosser Badge")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'shortNameInput'], [By.TAG_NAME, 'input']], "Flosser")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'pointsInput'], [By.TAG_NAME, 'input']], "3")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'limitPerPlayerInput'], [By.TAG_NAME, 'input']], "900")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'badgeImageUrlInput'], [By.TAG_NAME, 'input']], "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Zombie-156055.svg/2000px-Zombie-156055.svg.png")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']])
  driver.SendKeys([[By.NAME, 'admin-rewards-card'], [By.ID, 'descriptionInput'], [By.TAG_NAME, 'textarea']], "A reward you get for brushing and flossing after eating humans.")
  driver.Click([[By.NAME, 'admin-rewards-card'], [By.ID, 'done']])

  # Generate 22 rewards.
  driver.Click([[By.NAME, 'row-Flosser'], [By.ID, 'menu']])
  driver.Click([[By.NAME, 'row-Flosser'], [By.NAME, 'menu-item-Show Rewards']])
  driver.SendKeys([[By.ID, 'newReward'], [By.TAG_NAME, 'input']], "22")
  driver.Click([[By.ID, 'addReward']])

  # Check that at least some
  driver.ExpectContains([[By.NAME, 'row-rewardcode 0']], '(unclaimed)')
  driver.ExpectContains([[By.NAME, 'row-rewardcode 21']], '(unclaimed)')


  # Export the rewards.
  driver.Click([[By.NAME, 'row-Flosser'], [By.ID, 'menu']])
  driver.Click([[By.NAME, 'row-Flosser'], [By.NAME, 'menu-item-Export Rewards']])
  driver.ExpectContains([[By.ID, 'codesDialogContents']], 'rewardcode 0')
  driver.ExpectContains([[By.ID, 'codesDialogContents']], 'rewardcode 21')
  driver.Click([[By.ID, 'codesDialog'],[By.NAME, 'done']])

  # Zeke was a cool zombie! He ate a bunch of humans, then brushed his teeth. He was awarded a reward.

  driver.SwitchUser('zeke')

  #driver.Click([[By.NAME, 'close-notification']])

  # change to drawer????
  # driver.SendKeys([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']], 'row-rewardcode 0')
  # driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'claim']])





  # driver.Quit()

finally:
  pass