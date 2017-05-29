import time
from driver import RetryingDriver

from selenium.webdriver.common.by import By

try:
  driver = RetryingDriver("deckerd")

  driver.Click([[By.NAME, 'declareAllegiance']])

  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']])

  driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option0']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'offWeGo']])

  # TODO: Using sleep here is unfortunate. It would be better to, in a
  # giant retried block, click on an option and verify it went to the right

  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.ExpectContains(
      [[By.NAME, 'interviewQuestion0Page'], [By.ID, 'prompt']],
      'incorrect')
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'reset']])

  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']])
  time.sleep(.1)

  driver.ExpectContains(
      [[By.NAME, 'interviewQuestion0Page'], [By.ID, 'prompt']],
      'continue')
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'confirm']])


  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer4']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'confirm']])


  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer0']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer1']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer2']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer3']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer4']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer5']])
  time.sleep(.1)
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'confirm']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

  driver.FindElement([[By.NAME, 'ChatRoom: Resistance Comms Hub']])

  driver.Click([[By.NAME, 'drawerLeaderboard']])

  driver.ExpectContains(
      [[By.TAG_NAME, 'ghvz-display-page'],
       [By.NAME, 'Leaderboard Allegiance Cell Deckerd the Hesitant']],
      'resistance')

  driver.ExpectContains(
      [[By.TAG_NAME, 'ghvz-display-page'],
       [By.NAME, 'Leaderboard Points Cell Deckerd the Hesitant']],
      '0')

  driver.ExpectContains(
      [[By.TAG_NAME, 'ghvz-display-page'],
       [By.NAME, 'Leaderboard Name Cell Deckerd the Hesitant']],
      'Deckerd the Hesitant')

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
