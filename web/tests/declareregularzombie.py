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
# In declare.py (where secret zombie is chosen) Make sure that an undeclared person can see rules, global chat, no missions

# Time for Deckerd to choose a side
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'declareAllegiance']]),
  lambda: driver.FindElement([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option1']])) # Zombie ("Horde")

# Choose zombie!
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option1']]),
  lambda: driver.FindElement([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option1']])) # Regular zombie

# Choose regular (non-secret) zombie!
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option1']]),
  lambda: driver.FindElement([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'offWeGo']]))

# Click next to start the quiz
driver.RetryUntil(
  lambda: driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'offWeGo']]),
  lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']]))


####### Quiz ######
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer0']]),
  lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected0']]))
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer2']]),
  lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected2']]))
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer3']]),
  lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected3']]))
driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'answer1']]),
  lambda: driver.FindElement([[By.NAME, 'interviewQuestion0Page'], [By.NAME, 'selected1']]))
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

driver.RetryUntil( 
  lambda: driver.Click([[By.NAME, 'interviewQuestion2Page'], [By.NAME, 'confirm']]),
  lambda: driver.FindElement([[By.NAME, 'interviewQuestion3Page'], [By.NAME, 'answer0']]))
driver.Click([[By.NAME, 'interviewQuestion3Page'], [By.NAME, 'answer0']])
driver.DismissAlert()
driver.Click([[By.NAME, 'interviewQuestion3Page'], [By.NAME, 'answer1']])
driver.DismissAlert()
driver.Click([[By.NAME, 'interviewQuestion3Page'], [By.NAME, 'answer2']])

driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

# Make sure that deckerd is in the zombie chat and sees all the correct widgets

driver.FindElement([[By.NAME, 'rules-box']])
driver.FindElement([[By.NAME, 'next-mission-box']])

if not driver.is_mobile:
  driver.FindElement([[By.NAME, 'stats-box']])
  driver.FindElement([[By.NAME, 'rewards-box']])



driver.DrawerMenuClick('mobile-main-page', 'Chat')

driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'Horde ZedLink']])
driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'Global Chat']])
driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'Zeds Internal Secret Police']])
driver.DrawerMenuClick('chat-card', 'Leaderboard')
driver.ExpectContains(
    [[By.NAME, 'leaderboard-card'],
     [By.NAME, 'Leaderboard Allegiance Cell DeckerdTheHesitant']],
    'horde')
driver.ExpectContains(
    [[By.NAME, 'leaderboard-card'],
     [By.NAME, 'Leaderboard Points Cell DeckerdTheHesitant']],
    '0')
driver.ExpectContains(
    [[By.NAME, 'leaderboard-card'],
     [By.NAME, 'Leaderboard Name Cell DeckerdTheHesitant']],
    'DeckerdTheHesitant')
driver.DrawerMenuClick('leaderboard-card', 'Dashboard')

driver.SwitchUser('zella')
driver.DrawerMenuClick('mobile-main-page', 'Admin Players')
driver.ExpectContains([[By.NAME, 'player-row-DeckerdTheHesitant'], [By.ID, 'allegiance']], "Horde")


driver.Quit()
