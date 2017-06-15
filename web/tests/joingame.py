import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="reggie")

try:
  driver.FindElement([[By.NAME, 'joinGame']])

  driver.Click([[By.NAME, 'joinGame']])

  driver.SendKeys(
      [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
      'ReggieTheRavager')

  driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])

  driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joingGameTakePhotos'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option2']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option4']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option5']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option8']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.TAG_NAME, 'paper-button']])

  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

  driver.FindElement([[By.TAG_NAME, 'ghvz-rules']])

  driver.FindElement([[By.NAME, 'ChatRoom: Global Chat']])
  
  driver.Click([[By.NAME, 'drawerLeaderboard']])

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Name Cell ReggieTheRavager']],
      'ReggieTheRavager')

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Allegiance Cell ReggieTheRavager']],
      'undeclared')

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Points Cell ReggieTheRavager']],
      '0')

  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.SwitchUser('zella')

  # driver.SwitchUser("drake")

  # driver.Click([[By.NAME, 'drawerMy Profile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '100')

  # driver.Click([[By.NAME, 'drawerDashboard']])

  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # driver.Click([[By.ID, 'infect']])

  # driver.ExpectContains(
  #     [[By.ID, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # driver.Click([[By.NAME, 'drawerMy Profile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '200')

  # driver.SwitchUser("jack")

  # driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  # driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']])
  
  # driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.Quit()

finally:
  # driver.Quit()
  pass
