import setup
from selenium.webdriver.common.by import By
import time

driver = setup.MakeDriver()
driver.WaitForGameLoaded()

try:
  playerNames = {
        'zella': 'ZellaTheUltimate',
        'deckerd': 'DeckerdTheHesitant',
        'moldavi': 'MoldaviTheMoldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'JackSlayerTheBeanSlasher'
      }

  def testChat(playersInChat, playersNotInChat, chatName, chatId):
    try: 

      # Make sure all the players in the chat can post a message
      for index, player in enumerate(playersInChat):

        driver.SwitchUser(player)

        if driver.is_mobile:
          driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'drawerChat']])
          driver.FindElement([[By.NAME, chatId]])
          driver.Click([[By.NAME, chatId]])

        # Make sure drawer opens fine
        # TODO(verdagon): known flake (on remote only? ... nope :( I'm having this trouble locally too. -aliengirl)
        driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'icon-%s' % chatName]])
        time.sleep(1)
        driver.FindElement(
          [[By.NAME, chatId], [By.NAME, 'drawer-%s' % chatName], [By.NAME, playerNames[player]]], wait_long=True)
        driver.Click([[By.NAME, chatId], [By.NAME, 'icon-%s' % chatName]])

        # Post a message
        driver.FindElement([[By.NAME, chatId]], check_visible=False) # Check that the chat exists
        driver.SendKeys([[By.NAME, chatId], [By.NAME, 'input-%s' % chatName], [By.TAG_NAME, 'textarea']], 'Brains for %s' % player)
        driver.Click([[By.NAME, chatId], [By.NAME, 'submit-%s' % chatName]])

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

        if driver.is_mobile:
          driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'drawerDashboard']]) #TODO - sometimes this doesn't work

      # Check that the chat doesn't exist for players not in the chat
      for player in playersNotInChat:
        driver.SwitchUser(player)

        if driver.is_mobile:
          driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'drawerChat']])
          driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-room-list']], chatName, False)
          driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'drawerDashboard']])
        else:
          driver.DontFindElement([[By.NAME, 'ChatRoom: %s' % chatName]]) 

    finally:
      pass

  # GLOBAL CHAT ROOM - all types of joined players + admins should view.
  globalPlayers = ['zella', 'deckerd', 'moldavi', 'drake', 'zeke', 'jack']
  nonGlobalPlayers = []
  testChat(globalPlayers, [], 'Global Chat', 'chatRoom-everyone-1')

  # # HORDE CHAT ROOM - only declared zombies should view
  # zombiePlayers = ['zeke','drake']
  # nonZombiePlayers = ['zella', 'deckerd', 'moldavi', 'jack']
  # testChat(zombiePlayers, nonZombiePlayers, 'Horde ZedLink', 'chatRoom-horde-3')

  # # HUMAN CHAT ROOM - only declared humans should view
  # humanPlayers = ['zella', 'moldavi', 'jack']
  # nonHumanPlayers = ['deckerd', 'drake', 'zeke']
  # testChat(humanPlayers, nonHumanPlayers, 'Resistance Comms Hub', 'chatRoom-resistance-2')

  driver.Quit()

finally:
  pass

