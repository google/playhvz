import sys
import time
from driver import WholeDriver

from selenium.webdriver.common.by import By

driver = WholeDriver(
    user="zella",
    env=sys.argv[1],
    password=sys.argv[2])
driver.WaitForGameLoaded()

playerNames = {
      'zella': 'Zella the Ultimate',
      'deckerd': 'Deckerd the Hesitant',
      'moldavi': 'Moldavi the Moldavish',
      'drake': 'Drackan',
      'zeke': 'Zeke',
      'jack': 'Jack Slayer the Bean Slasher'
    }

def testChat(playersInChat, playersNotInChat, chatName):
  try: 

    # Make sure all the players in the chat can post a message
    for index, player in enumerate(playersInChat):

      driver.SwitchUser(player)

      # Make sure drawer opens fine
      driver.Click([[By.NAME, 'icon-%s' % chatName]])
      driver.FindElement(
        [[By.NAME, 'drawer-%s' % chatName], [By.NAME, playerNames[player]]])
      driver.Click([[By.NAME, 'icon-%s' % chatName]])

      # Post a message
      driver.FindElement([[By.NAME, 'ChatRoom: %s' % chatName]]) # Check that the chat exists
      driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.TAG_NAME, 'textarea']], 'Brains for %s' % player)
      driver.Click([[By.NAME, 'submit-%s' % chatName]])

      # Loop through all previous posts
      for i in range(index + 1):

        currPlayer= playersInChat[i]
        currName = playerNames[currPlayer]

        # Check the message, the poster's name, and their avatar are there
        driver.ExpectContains([
          [By.NAME, 'message-%s-Brains for %s' % (chatName, currPlayer)], 
          [By.CLASS_NAME, 'message-text']], 
          'Brains for %s' % currPlayer)
        driver.ExpectContains([
          [By.NAME, 'message-%s-Brains for %s' % (chatName, currPlayer)], 
          [By.CLASS_NAME, 'player-name']], 
          currName)
        driver.FindElement([[By.NAME, 'avatar-%s-Brains for %s' % (chatName, currPlayer)]])
        
        # Check the last one shows up as yours, and all others belong to other people
        if i == index:
          driver.FindElement([
            [By.CLASS_NAME, 'message-from-me']])
        else:
          driver.FindElement([
            [By.CLASS_NAME, 'message-from-other']])

    for player in playersNotInChat:
      driver.SwitchUser(player)
      driver.DontFindElement([[By.NAME, 'ChatRoom: %s' % chatName]]) # Check that the chat doesn't exist

  finally:
    pass

# GLOBAL CHAT ROOM - all types of joined players + admins should view.
globalPlayers = ['zella', 'deckerd', 'moldavi', 'drake', 'zeke', 'jack']
nonGlobalPlayers = ['reggie', 'minnie']
testChat(globalPlayers, [], 'Global Chat')

# HORDE CHAT ROOM - only declared zombies should view
zombiePlayers = ['drake', 'zeke']
nonZombiePlayers = ['reggie', 'minny', 'zella', 'deckerd', 'moldavi', 'jack']
testChat(zombiePlayers, nonZombiePlayers, 'Horde ZedLink')

# HUMAN CHAT ROOM - only declared humans should view
humanPlayers = ['zella', 'moldavi', 'jack']
nonHumanPlayers = ['reggie', 'minny','deckerd', 'drake', 'zeke']
testChat(humanPlayers, nonHumanPlayers, 'Resistance Comms Hub')


