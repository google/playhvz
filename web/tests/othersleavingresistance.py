import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="jack")

INFECTABLES = [ # these names seem to have collapsed in the last pull
 ('MoldaviTheMoldavish', 'zooble flipwoogly', 'Moldavi the Moldavish'),
 ('JackSlayerTheBeanSlasher', 'grobble forgbobbly', 'Jack Slayer the Bean Slasher'),
 ('ZellaTheUltimate', 'glarple zerp wobbledob', 'Zella the Ultimate')
]

try:
  driver.FindElement([[By.NAME, 'ChatRoom: Resistance Comms Hub']])

  driver.SwitchUser("drake")

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')

  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.Click([[By.NAME, 'drawerGame Stats']])
  zombie_start_count = int(driver.FindElement([[By.NAME, 'stats-card'],
                            [By.ID, 'current_population_meta'],
                            [By.ID, 'zombie_count']]).text)

  driver.Click([[By.NAME, 'drawerDashboard']])

  for target in INFECTABLES:
    # only zombies have lifeCodeInput
    driver.SendKeys(
        [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
        target[1])

    driver.Click([[By.ID, 'infect']])

    driver.ExpectContains([[By.NAME, 'victimName']], target[0])

    driver.Click([[By.ID, 'infected'], [By.ID, 'done']])

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.ExpectContains([[By.NAME, 'profilePoints']], '402')

  driver.SwitchUser("jack")

  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']])

  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.Click([[By.NAME, 'drawerGame Stats']])


  zombie_end_count = zombie_start_count + len(INFECTABLES)
  # check our charts. Ensure that new zombie counts are reflected
  driver.ExpectContains([[By.NAME, 'stats-card'],
                          [By.ID, 'current_population_meta'],
                          [By.ID, 'zombie_count']], str(zombie_end_count),
                          check_visible=False)

  driver.ExpectContains([[By.NAME, 'stats-card'],
                          [By.ID, 'population_over_time_meta'],
                          [By.ID, 'zombie_start_count']], str(zombie_start_count),
                          check_visible=False)

  driver.ExpectContains([[By.NAME, 'stats-card'],
                          [By.ID, 'population_over_time_meta'],
                          [By.ID, 'zombie_end_count']], str(zombie_end_count),
                          check_visible=False)


  driver.Quit()

finally:
  # driver.Quit()
  pass
