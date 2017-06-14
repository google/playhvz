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
  
  def testAdminChat(actingPlayer, adminPlayers):
    try: 
      actingPlayerName = playerNames[actingPlayer]
      chatName = actingPlayerName + ' & HvZ CDC'
      xpathForPageElement = "//ghvz-app[contains(@id, '%sApp')]//ghvz-card[contains(@class, 'ghvz-display-game-page')]//%s[contains(@name, '%s')]"

      # Create chat with admin
      driver.SwitchUser(actingPlayer)

      driver.Click([[By.NAME, 'drawerChat']])  # Change to chat page

      driver.FindElement([[By.NAME, 'create-admin-chat-button']])
      driver.Click([[By.NAME, 'create-admin-chat-button']]) 
      driver.FindElement([[By.NAME, 'ChatRoom: %s' % chatName]])  
      driver.DontFindElement([[By.NAME, 'create-admin-chat-button']])

      # Type a message into the chat
      xpathTextarea = xpathForPageElement % (actingPlayer, 'textarea', 'input-' + chatName)
      xpathSend = xpathForPageElement % (actingPlayer, 'paper-button', 'submit-' + chatName)
      
      driver.FindElement([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]]) 
      driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]], 
        'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
      driver.Click([[By.NAME, 'submit-%s' % chatName], [By.XPATH, xpathSend]])

      # Check that every admin sees the chat and message
      for admin in adminPlayers:
        driver.SwitchUser(admin)
        driver.FindElement([[By.NAME, 'drawer-' + chatName]])  
        driver.Click([[By.NAME, 'drawer-' + chatName]])  
        driver.ExpectContains([
            [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
            [By.CLASS_NAME, 'message-text']], 
            'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

      # Non-Admin should leave admin chat
      driver.SwitchUser(actingPlayer)
      driver.Click([[By.NAME, 'drawer-' + chatName]])  # Open Admin chat room

      xpathChatDrawerButton = xpathForPageElement % (actingPlayer, 'paper-icon-button', 'chat-info-' + chatName)
      driver.Click([[By.XPATH, xpathChatDrawerButton]])  
      driver.FindElement([[By.NAME, 'chat-drawer-%s' % chatName], [By.NAME, playerNames[actingPlayer]]])
      
      xpathLeaveButton = xpathForPageElement % (actingPlayer, 'a', 'chat-drawer-leave')
      driver.FindElement([[By.XPATH, xpathLeaveButton]])
      driver.Click([[By.XPATH, xpathLeaveButton]])

      xpathLeaveDialog = xpathForPageElement % (actingPlayer, '*', 'chat-leave-dialog-' + chatName)
      driver.FindElement([[By.XPATH, xpathLeaveDialog]])
      driver.Click([[By.XPATH, xpathLeaveDialog], [By.ID, 'done']])
      driver.DontFindElement([[By.XPATH, xpathLeaveDialog]])
      
      # Verify chat with admin button is available after leaving admin chat
      driver.FindElement([[By.NAME, 'create-admin-chat-button']])
      
    finally:
      pass

  # Run admin chat tests 
  testAdminChat('zeke', adminPlayers)

  driver.Quit()

finally:
  pass
