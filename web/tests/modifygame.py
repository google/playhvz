from driver import RetryingDriver

from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = RetryingDriver("zella")

  # See rules sheet on dashboard
  driver.FindElement([[By.NAME, 'Rules']])

  # See rules page and FAQ page on sidebar
  driver.ExpectContains([[By.NAME, 'playerPagesJoined']], "Rules")
  driver.ExpectContains([[By.NAME, 'playerPagesJoined']], "FAQ")

  # Go to the Admin dashboard
  driver.Click([[By.NAME, 'Admin Dashboard']])

  # Open up rules, type something.
  driver.FindElement([[By.NAME, 'Rules']])
  driver.Click([[By.TAG_NAME, 'ghvz-desktop-admin-page'], [By.NAME, 'rules-icon'], [By.ID, 'icon']]) 
  driver.SendKeys(
      [[By.NAME, 'admin-page'], [By.TAG_NAME, 'textarea']],
      'rules are cools')

  # If you click Cancel, the new words shouldn't show up.
  driver.Click([[By.NAME, 'admin-page'],[By.ID, 'cancel']])
  driver.DontExpectContains(
      [[By.ID, 'rulesForm']],
      'rules are cools')

  # # Open up rules, type something different.
  driver.FindElement([[By.NAME, 'Rules']])
  driver.Click([[By.TAG_NAME, 'ghvz-desktop-admin-page'], [By.NAME, 'rules-icon'], [By.ID, 'icon']]) 
  driver.SendKeys(
      [[By.NAME, 'admin-page'], [By.TAG_NAME, 'textarea']],
      'rules are cools when you save them')

  # # If you click Save, the new words should show up.
  driver.Click([[By.NAME, 'admin-page'],[By.ID, 'cancel']])
  driver.DontExpectContains(
      [[By.ID, 'rulesForm']],
      'rules are cools when you save them')

  # Open up Game settings, set a new stun timer
  driver.Click([[By.NAME, 'game-icon'], [By.ID, 'icon']])
  driver.SendKeys(
      [[By.ID, 'gameForm'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')

  # If you click Cancel, the new stun timer shouldn't show up.
  driver.Click([[By.ID, 'infect']])
  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'Jack Slayer the Bean Slasher')

  # # Open up settings, set a new stun timer.
  # driver.Click([[By.NAME, 'drawerDashboard']])  
  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # # If you click Save, the new stun timer should show up.
  # driver.Click([[By.ID, 'infect']])
  # driver.ExpectContains(
  #     [[By.NAME, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # # Go to the FAQ page
  # driver.Click([[By.NAME, 'drawerProfile']])

  #   # Open up settings, set a new stun timer
  # driver.Click([[By.NAME, 'drawerDashboard']])  
  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # # If you click Cancel, the new stun timer shouldn't show up.
  # driver.Click([[By.ID, 'infect']])
  # driver.ExpectContains(
  #     [[By.NAME, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # # Open up settings, set a new stun timer.
  # driver.Click([[By.NAME, 'drawerDashboard']])  
  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # # If you click Save, the new stun timer should show up.
  # driver.Click([[By.ID, 'infect']])
  # driver.ExpectContains(
  #     [[By.NAME, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # # Sign in as every user type, make sure all can see rules on dashboard + have rules page
  # players = ['zella', 'deckerd', 'moldavi', 'drake', 'zeke', 'jack']
  # for player in players:
  #   driver.SwitchUser("jack")
  #   driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

finally:
  # driver.Quit()
  pass
