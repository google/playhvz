import setup
from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = setup.MakeDriver(user="zella")

  # Go to Jack's profile (currently can't infect)
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']]) 

  # Click the Set Can Infect button
  driver.Click([[By.ID, 'set-infect-button']])
  driver.FindElement([[By.ID, 'unset-infect-button']])
  driver.ExpectContains([[By.NAME, 'can-infect']], "Yes")

  # Sign in as Jack, confirm that he can infect
  driver.SwitchUser("jack")
  driver.FindElement([[By.NAME, "infect-box"]])
  driver.SendKeys(
        [[By.NAME, 'infect-box'], [By.TAG_NAME, 'input']],
        'glarple zerp wobbledob') # Zella's life code
  driver.Click([[By.ID, 'infect']])
  driver.ExpectContains([[By.NAME, 'infect-box']], "you've infected ZellaTheUltimate!")

  # Sign back in as Zella (admin)
  driver.SwitchUser("zella")

  # Check her profile, see that she's now a zombie
  driver.Click([[By.NAME, 'drawerMy Profile']])
  driver.ExpectContains([[By.NAME, 'status']], "Living Dead")

  # Navigate to Jack's profile
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-JackSlayerTheBeanSlasher'], [By.ID, 'name']]) 

  # Unset Can Infect for Jack
  driver.Click([[By.ID, 'unset-infect-button']])
  driver.FindElement([[By.ID, 'set-infect-button']])
  driver.ExpectContains([[By.NAME, 'can-infect']], "No")

  # Sign in as Jack, confirm that he can no longer infect people
  driver.SwitchUser("jack")
  driver.FindElement([[By.NAME, "infect-box"]], False)

  driver.Quit()

finally:
  pass



