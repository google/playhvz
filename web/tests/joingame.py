import time
from driver import RetryingDriver

from selenium.webdriver.common.by import By

try:
  driver = RetryingDriver("reggie")

  driver.FindElement([[By.NAME, 'joinGame']])

  driver.Click([[By.NAME, 'joinGame']])

  driver.SendKeys(
      [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
      'Reggie the Ravager')

  driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])

  driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option2']])

  driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option0']])

  driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option1']])

  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option2']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option4']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option5']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.NAME, 'option8']])
  driver.Click([[By.NAME, 'joinGameVolunteerPositionsPage'], [By.TAG_NAME, 'paper-button']])

  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'offWeGo']])

  # TODO: Using sleep here is unfortunate. It would be better to, in a
  # giant retried block, click on an option and verify it went to the right

  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.ExpectContains(
      [[By.NAME, 'joinGameQuestion0Page'], [By.ID, 'prompt']],
      'incorrect')
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'reset']])

  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'answer3']])
  time.sleep(.1)

  driver.ExpectContains(
      [[By.NAME, 'joinGameQuestion0Page'], [By.ID, 'prompt']],
      'continue')
  driver.Click([[By.NAME, 'joinGameQuestion0Page'], [By.NAME, 'confirm']])


  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'answer4']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion1Page'], [By.NAME, 'confirm']])


  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer4']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'answer5']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'joinGameQuestion2Page'], [By.NAME, 'confirm']])

  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

  driver.FindElement([[By.TAG_NAME, 'ghvz-rules']])

  driver.Click([[By.NAME, 'drawerLeaderboard']])

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Name Cell Reggie the Ravager']],
      'Reggie the Ravager')

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Allegiance Cell Reggie the Ravager']],
      'none')

  driver.ExpectContains(
      [[By.NAME, 'Leaderboard Points Cell Reggie the Ravager']],
      '0')

  driver.Click([[By.NAME, 'drawerDashboard']])

  driver.SwitchUser('zella')

  # driver.SwitchUser("drake")

  # driver.Click([[By.NAME, 'drawerProfile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '100')

  # driver.Click([[By.NAME, 'drawerDashboard']])

  # driver.SendKeys(
  #     [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
  #     'grobble forgbobbly')

  # driver.Click([[By.ID, 'infect']])

  # driver.ExpectContains(
  #     [[By.ID, 'victimName']],
  #     'Jack Slayer the Bean Slasher')

  # driver.Click([[By.NAME, 'drawerProfile']])

  # driver.ExpectContains([[By.NAME, 'profilePoints']], '200')

  # driver.SwitchUser("jack")

  # driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])

  # driver.FindElement([[By.NAME, 'ChatRoom: Horde ZedLink']])
  
  # driver.Click([[By.NAME, 'drawerProfile']])


finally:
  # driver.Quit()
  pass
