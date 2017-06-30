#!/usr/bin/python
#
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""TODO: High-level file comment."""

import sys


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
import sys
from driver import WholeDriver
import setup

from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="deckerd")

try:
  # Make sure that an undeclared person can see rules, global chat, no missions: TODO(aliengirl): add this

  # Time for Decker to choose a side
  driver.Click([[By.NAME, 'declareAllegiance']])

  # Choose human!
  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']])

  # Choose possessed human.
  # TODO(aliengirl): crashed here - maybe add RetryUntil?
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

  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'reset']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected1']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected2']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected3']]))
  
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'confirm']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer0']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer1']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected1']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer2']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected2']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer3']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected3']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'answer4']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'selected4']]))
  
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion1Page'], [By.NAME, 'confirm']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer0']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected0']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer1']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected1']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer2']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected2']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer3']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected3']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer4']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected4']]))
  driver.RetryUntil( 
    lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'answer5']]),
    lambda: driver.FindElement([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'selected5']]))
  driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'confirm']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

  # Make sure that Jack is in the human chat and has appeared on the Leaderboard
  driver.DrawerMenuClick('mobile-main-page', 'Chat')

  driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'Resistance Comms Hub']])
  driver.DrawerMenuClick('chat-card', 'Leaderboard')
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
  driver.DrawerMenuClick('leaderboard-card', 'Dashboard')

  # Have Drake (a zombie) infect Jack
  driver.SwitchUser("drake")

  driver.DrawerMenuClick('mobile-main-page', 'My Profile')
  driver.ExpectContains([[By.NAME, 'profilePoints']], '102')
  
  driver.DrawerMenuClick('profile-card', 'Dashboard')
  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')
  driver.Click([[By.ID, 'infect']])
  driver.ExpectContains(
      [[By.NAME, 'victimName']],
      'JackSlayerTheBeanSlasher')

  # Check that Drake got points for his infection
  driver.DrawerMenuClick('mobile-main-page', 'My Profile')
  driver.ExpectContains([[By.NAME, 'profilePoints']], '202')

  # Check that Jack is now a zombie
  driver.SwitchUser("jack")
  driver.FindElement([[By.TAG_NAME, 'ghvz-infect']])
  driver.DrawerMenuClick('mobile-main-page', 'Chat')
  driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'Horde ZedLink']])

  driver.Quit()

finally:
  pass
