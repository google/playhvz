import sys
import setup
import time
from driver import WholeDriver
import setup

from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="deckerd")

try:
  # Time for Decker to choose a side
  driver.Click([[By.NAME, 'declareAllegiance']])

  # Choose human!
  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']])

  # Choose possessed human.
  driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option0']])

  # Click next to start the quiz
  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'offWeGo']])


  ####### Quiz ######
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected0']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected2']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected3']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected1']])
  driver.ExpectContains(
      [[By.NAME, 'interviewQuestion0Page'], [By.ID, 'prompt']],
      'incorrect')

  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'reset']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected0']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected1']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected2']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']])
  driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected3']])
  driver.FindElement(
    [[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'confirm']])
  driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'confirm']])

  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer0']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer0']])
  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected0']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer1']])
  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected1']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer2']])
  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected2']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer3']])
  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected3']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer4']])
  driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected4']])
  driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'confirm']])

  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer0']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer0']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected0']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer1']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected1']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer2']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected2']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer3']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected3']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer4']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected4']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer5']])
  driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected5']])
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'confirm']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

  # Make sure that Jack is in the human chat and has appeared on the Leaderboard
  driver.FindElement([[By.NAME, 'Resistance Comms Hub']])

  driver.Click([[By.NAME, 'drawerLeaderboard']])

  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'],
       [By.NAME, 'Leaderboard Allegiance Cell DeckerdTheHesitant']],
      'resistance')

  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'],
       [By.NAME, 'Leaderboard Points Cell DeckerdTheHesitant']],
      '0')

  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'],
       [By.NAME, 'Leaderboard Name Cell DeckerdTheHesitant']],
      'DeckerdTheHesitant')

  driver.Click([[By.NAME, 'drawerDashboard']])

  # Have Drake (a zombie infect Jack)
  driver.SwitchUser("drake")
  driver.Click([[By.NAME, 'drawerMy Profile']])
  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')
  driver.Click([[By.NAME, 'drawerDashboard']])
  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')
  driver.Click([[By.ID, 'infect']])
  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'JackSlayerTheBeanSlasher')

  # Check that Drake got points for his infection
  driver.Click([[By.NAME, 'drawerMy Profile']])
  driver.ExpectContains([[By.NAME, 'profilePoints']], '202')

  # Check that Jack is now a zombie
  driver.SwitchUser("jack")
  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])
  driver.FindElement([[By.NAME, 'Horde ZedLink']])
  driver.Click([[By.NAME, 'drawerMy Profile']])

  driver.Quit()

finally:
  pass
