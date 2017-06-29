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

  def testChat(playersInChat, playersNotInChat, chatName):
    try: 

      # Make sure all the players in the chat can post a message
      for index, player in enumerate(playersInChat):

        driver.SwitchUser(player)

        try:
         driver.Click([[By.NAME, 'close-notification']])
        except AssertionError:
          pass # This user didn't have a notification

        if driver.is_mobile:
          driver.FindElement([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
        driver.Click([[By.NAME, 'drawerChat']]) # Uh oh - crashed here on mobile (the drawer didn't open right)
        driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, chatName]]) # another uh oh - it crashed here (the drawer opened, but never clicked on chat)
        driver.Click([[By.NAME, 'chat-card'], [By.NAME, chatName]]) # aaah, crashed here too on mobile

        # Make sure drawer opens fine
        # # TODO(verdagon): known flake (on remote only? ... nope :( I'm having this trouble locally too. -aliengirl)
        driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-%s' % chatName]])
        driver.FindElement(
          [[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-%s' % chatName], [By.NAME, playerNames[player]]])
        driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'chat-info-%s' % chatName]])

        # Post a message
        driver.FindElement([[By.NAME, "ChatRoom: %s" % chatName]], check_visible=False) # Check that the chat exists
        driver.SendKeys([
          [By.NAME, 'chat-card'], 
          [By.NAME, 'input-%s' % chatName], 
          [By.TAG_NAME, 'textarea']], 'Brains for %s' % player)
        driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'submit-%s' % chatName]])

        # Loop through all previous posts
        for i in range(index + 1):

          currPlayer= playersInChat[i]
          currName = playerNames[currPlayer]

          # Check the message, the poster's name, and their avatar are there
          driver.ExpectContains([
            [By.NAME, 'chat-card'], 
            [By.NAME, 'message-%s-Brains for %s' % (chatName, currPlayer)], 
            [By.CLASS_NAME, 'message-bubble']], 
            'Brains for %s' % currPlayer)
          driver.ExpectContains([
            [By.NAME, 'chat-card'], 
            [By.NAME, 'message-%s-Brains for %s' % (chatName, currPlayer)], 
            [By.CLASS_NAME, 'player-name']], 
            currName)
          driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'avatar-%s-Brains for %s' % (chatName, currPlayer)]])
          
          # Check the last one shows up as yours, and all others belong to other people
          if i == index:
            driver.FindElement([
              [By.NAME, 'chat-card'], 
              [By.CLASS_NAME, 'message-from-me']])
          else:
            driver.FindElement([
              [By.NAME, 'chat-card'], 
              [By.CLASS_NAME, 'message-from-other']])

        if driver.is_mobile:
          driver.Click([[By.NAME, 'chat-card'], [By.NAME, 'drawerButton']])
        driver.Click([[By.NAME, 'drawerDashboard']])

      # Check that the chat doesn't exist for players not in the chat
      for player in playersNotInChat:
        driver.SwitchUser(player)

        if driver.is_mobile:
          driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
          driver.Click([[By.NAME, 'drawerChat']]) # Crashed here :(
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
  testChat(globalPlayers, [], 'Global Chat')

  # HORDE CHAT ROOM - only declared zombies should view
  zombiePlayers = ['zeke','drake']
  nonZombiePlayers = ['zella', 'deckerd', 'moldavi', 'jack']
  testChat(zombiePlayers, nonZombiePlayers, 'Horde ZedLink')

  # HUMAN CHAT ROOM - only declared humans should view
  humanPlayers = ['zella', 'moldavi', 'jack']
  nonHumanPlayers = ['deckerd', 'drake', 'zeke']
  testChat(humanPlayers, nonHumanPlayers, 'Resistance Comms Hub')

  driver.Quit()

finally:
  pass

