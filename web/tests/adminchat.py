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

  def getPathToElement(player, tag, name):
    xpathForPageElement = "//ghvz-app[contains(@id, '%sApp')]//ghvz-card[contains(@class, 'ghvz-display-game-page')]//%s[contains(@name, '%s')]"
    return xpathForPageElement % (player, tag, name)

  def changeToPage(driver, drawerOption):
    driver.Click([[By.NAME, 'drawer' + drawerOption]])

  def closeNotifications(driver):
    try: 
      driver.Click([[By.NAME, 'close-notification']])
    finally:
      pass
  
  def testAdminChat(actingPlayer, adminPlayers):
    try: 
      actingPlayerName = playerNames[actingPlayer]
      chatName = actingPlayerName + ' & HvZ CDC'

      # Create chat with admin
      driver.SwitchUser(actingPlayer)
      closeNotifications(driver)

      changeToPage(driver, 'Chat')

      driver.FindElement([[By.NAME, 'create-admin-chat-button']])
      driver.Click([[By.NAME, 'create-admin-chat-button']]) 
      driver.FindElement([[By.NAME, 'ChatRoom: %s' % chatName]])  
      driver.DontFindElement([[By.NAME, 'create-admin-chat-button']])

      # Type a message into the chat
      xpathTextarea = getPathToElement(actingPlayer, 'textarea', 'input-' + chatName)
      xpathSend = getPathToElement(actingPlayer, 'paper-button', 'submit-' + chatName)
      
      driver.FindElement([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]]) 
      driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]], 
        'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
      driver.Click([[By.NAME, 'submit-%s' % chatName], [By.XPATH, xpathSend]])

      # Check that every admin sees the chat and message
      for admin in adminPlayers:
        driver.SwitchUser(admin)
        closeNotifications(driver)
        driver.FindElement([[By.NAME, 'drawer-' + chatName]])  
        changeToPage(driver, '-' + chatName)
        driver.ExpectContains([
            [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
            [By.CLASS_NAME, 'message-text']], 
            'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

      # Non-Admin should leave admin chat
      driver.SwitchUser(actingPlayer)
      changeToPage(driver, '-' + chatName)

      xpathChatDrawerButton = getPathToElement(actingPlayer, 'paper-icon-button', 'chat-info-' + chatName)
      driver.Click([[By.XPATH, xpathChatDrawerButton]])  
      driver.FindElement([[By.NAME, 'chat-drawer-%s' % chatName], [By.NAME, playerNames[actingPlayer]]])
      
      xpathLeaveButton = getPathToElement(actingPlayer, 'a', 'chat-drawer-leave')
      driver.FindElement([[By.XPATH, xpathLeaveButton]])
      driver.Click([[By.XPATH, xpathLeaveButton]])

      xpathLeaveDialog = getPathToElement(actingPlayer, '*', 'chat-leave-dialog-' + chatName)
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
