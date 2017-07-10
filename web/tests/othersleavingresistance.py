import setup
import pdb
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

# Make Zeke a human (just b/c we need more humans than we currently have)
driver.DrawerMenuClick('mobile-main-page', 'Admin Players')
driver.TableMenuClick([[By.NAME, 'player-row-Zeke']], 'Add Life')
driver.DismissAlert()

driver.SwitchUser('zeke')
# Zeke is in the Resistance Comms Hub
driver.DrawerMenuClick('mobile-main-page', 'Resistance Comms Hub')
driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-Resistance Comms Hub']])
driver.FindElement(
        [[By.NAME, 'chat-card'], 
        [By.NAME, 'chat-drawer-Resistance Comms Hub'], 
        [By.NAME, 'Zeke']])

INFECTABLES = [ # these names seem to have collapsed in the last pull
 ('MoldaviTheMoldavish', 'zooble flipwoogly', 'Moldavi the Moldavish'), # TheMoldavish
 ('JackSlayerTheBeanSlasher', 'grobble forgbobbly', 'Jack Slayer the Bean Slasher'),
 ('ZellaTheUltimate', 'glarple zerp wobbledob', 'Zella the Ultimate')
]

# Jack is a human here.
# switch to drake. We'll come back to jack in a bit
driver.SwitchUser("drake")

driver.DrawerMenuClick('mobile-main-page', 'My Profile')

driver.ExpectContains([[By.NAME, 'profilePoints']], '108')

# get initial counts of zombies from our stats pages

driver.DrawerMenuClick('profile-card', 'Game Stats')

driver.FindElement([[By.NAME, 'stats-card'],
                          [By.ID, 'current_population_meta'],
                          [By.ID, 'zombie_count']],
                          check_visible=False)

initial_zombie_start_count = 4
initial_zombie_end_count = 5

# ensure our zombies over time current value reflects the current population
driver.ExpectContains([[By.NAME, 'stats-card'],
                        [By.ID, 'population_over_time_meta'],
                        [By.ID, 'zombie_start_count']],
                        str(initial_zombie_start_count),
                        check_visible=False)
driver.ExpectContains([[By.NAME, 'stats-card'],
                        [By.ID, 'population_over_time_meta'],
                        [By.ID, 'zombie_end_count']],
                        str(initial_zombie_end_count),
                        check_visible=False)

driver.DrawerMenuClick('stats-card', 'Dashboard')

# start infecting humans
for target in INFECTABLES:
  # only zombies have lifeCodeInput
  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      target[1])

  driver.Click([[By.ID, 'infect']])

  driver.ExpectContains([[By.NAME, 'victimName']], target[0])

  driver.Click([[By.ID, 'infected'], [By.ID, 'done']])

# make sure drake's profile has updated points

driver.DrawerMenuClick('mobile-main-page', 'My Profile')

driver.ExpectContains([[By.NAME, 'profilePoints']], '408')

# ensure jack is a zombie now
driver.SwitchUser("jack")

driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

#driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']]) TODO(aliengirl): make this line work on mobile


# double check our stats
driver.DrawerMenuClick('mobile-main-page', 'Game Stats')

current_zombie_count = initial_zombie_end_count + len(INFECTABLES)

# check our charts. Ensure that new zombie counts are reflected
driver.ExpectContains([[By.NAME, 'stats-card'],
                        [By.ID, 'current_population_meta'],
                        [By.ID, 'zombie_count']],
                        str(current_zombie_count),
                        check_visible=False)
"""
driver.ExpectContains([[By.NAME, 'stats-card'],
                        [By.ID, 'population_over_time_meta'],
                        [By.ID, 'zombie_start_count']],
                        str(zombie_start_count),
                        check_visible=False)
"""

driver.ExpectContains([[By.NAME, 'stats-card'],
                        [By.ID, 'population_over_time_meta'],
                        [By.ID, 'zombie_end_count']],
                        str(current_zombie_count),
                        check_visible=False)

# Check that the turned humans have disappeared from the chat
driver.SwitchUser('zeke')

for target in INFECTABLES:
  driver.FindElement(
        [[By.NAME, 'chat-card'], 
        [By.NAME, 'chat-drawer-Resistance Comms Hub'], 
        [By.NAME, target[0]]],
        should_exist=False)

driver.Quit()

