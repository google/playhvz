import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver()
driver.WaitForGameLoaded()

try:
  playerNames = {
        'zella': 'Zella the Ultimate',
        'deckerd': 'Deckerd the Hesitant',
        'moldavi': 'Moldavi the Moldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'Jack Slayer the Bean Slasher'
      }

  adminPlayers = ['zella', 'moldavi']
  nonAdminPlayers = ['deckerd', 'drake', 'zeke', 'jack']
  
  def testAdminChat(adminPlayers, nonAdminPlayers):
    try: 
      actingPlayer = nonAdminPlayers[0]
      actingPlayerName = playerNames[actingPlayer]
      driver.SwitchUser(actingPlayer)

      driver.Click([[By.NAME, 'drawerChat']])  # Change to chat page

      driver.FindElement([[By.NAME, 'create-admin-chat-button']])  # Check that the create admin chat exists

      driver.Click([[By.NAME, 'create-admin-chat-button']])  # Create admin chat
      chatName = actingPlayerName + ' & HvZ CDC'
      driver.FindElement([[By.NAME, 'ChatRoom: %s' % chatName]])  # Check that the admin chat now exists
      driver.DontFindElement([[By.NAME, 'create-admin-chat-button']]) # Check that the create admin chat button is gone

      # Type a message into the chat
      xpathForChatWindowElement = "//ghvz-chat-room[contains(@class, 'chat-window')]//%s[contains(@name, '%s')]"
      xpathTextarea = xpathForChatWindowElement % ('textarea', 'input-' + chatName)
      xpathSend = xpathForChatWindowElement % ('paper-button', 'submit-' + chatName)
      driver.FindElement([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]]) 
      driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]], 
        'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
      driver.Click([[By.NAME, 'submit-%s' % chatName], [By.XPATH, xpathSend]])

      # Check that every admin sees the chat and the chat message
      for admin in adminPlayers:
        driver.SwitchUser(admin)
        driver.FindElement([[By.NAME, 'drawer-' + chatName]])  
        driver.Click([[By.NAME, 'drawer-' + chatName]])  
        driver.ExpectContains([
            [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
            [By.CLASS_NAME, 'message-text']], 
            'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

      raise AssertionError("Test still in development, this is expected")
      
    finally:
      pass

  # Run admin chat tests 
  testAdminChat(adminPlayers, nonAdminPlayers)

  driver.Quit()

finally:
  pass
