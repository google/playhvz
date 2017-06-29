import setup
from selenium.webdriver.common.by import By

## Test setup
playerNames = {
  'zella': 'ZellaTheUltimate',
  'deckerd': 'DeckerdTheHesitant',
  'moldavi': 'MoldaviTheMoldavish',
  'drake': 'Drackan',
  'zeke': 'Zeke',
  'jack': 'JackSlayerTheBeanSlasher'
}

adminPlayers = ['zella', 'moldavi']

def getPathToElement(playerName, tag, name):
  xpathForPageElement = "//*[contains(@id, 'chat-page-%s')]//%s[contains(@name, '%s')]"
  return xpathForPageElement % (playerName, tag, name)

def changeToPage(driver, drawerOption, currPage='mobile-main-page'):
  if driver.is_mobile:
    driver.Click([[By.NAME, currPage], [By.NAME, 'drawerButton']])

  driver.Click([[By.NAME, 'drawer' + drawerOption]])

def closeNotifications(driver):
    driver.Click([[By.NAME, 'close-notification']])



## Run admin chat test
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

actingPlayer = 'zeke'
actingPlayerName = playerNames[actingPlayer]
chatName = actingPlayerName + ' & HvZ CDC'

# Switch to right user and open chat page
driver.SwitchUser(actingPlayer)
changeToPage(driver, 'Chat')

# Create chat with admin
driver.FindElement([[By.NAME, 'create-admin-chat-button']])
driver.Click([[By.NAME, 'create-admin-chat-button']]) 
driver.FindElement([[By.NAME, "chat-room-%s" % chatName]])  
driver.DontFindElement([[By.NAME, 'create-admin-chat-button']])

# Type a message into the chat
xpathTextarea = getPathToElement(actingPlayerName, 'textarea', 'input-' + chatName)
xpathSend = getPathToElement(actingPlayerName, 'paper-button', 'submit-' + chatName)

driver.FindElement([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]]) 
driver.SendKeys([[By.NAME, 'input-%s' % chatName], [By.XPATH, xpathTextarea]], 
  'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)
driver.Click([[By.NAME, 'submit-%s' % chatName], [By.XPATH, xpathSend]])

# Check that every admin sees the chat and message
for admin in adminPlayers:
  driver.SwitchUser(admin)
  closeNotifications(driver)
  changeToPage(driver, '-' + chatName)
  driver.ExpectContains([
      [By.NAME, 'chat-card'], 
      [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
      [By.CLASS_NAME, 'message-bubble']], 
      'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

# Non-Admin should leave admin chat
driver.SwitchUser(actingPlayer)
changeToPage(driver, '-' + chatName)

xpathChatDrawerButton = getPathToElement(actingPlayerName, 'paper-icon-button', 'chat-info-' + chatName)
driver.Click([[By.XPATH, xpathChatDrawerButton]])  
xpathChatDrawer = getPathToElement(actingPlayerName, 'div', 'chat-drawer-%s' % chatName)
driver.FindElement([[By.XPATH, xpathChatDrawer]])  
#driver.FindElement([[By.NAME, 'chat-card'], [By.NAME, 'chat-drawer-%s' % chatName]])

xpathLeaveButton = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeaveButton]])
driver.Click([[By.XPATH, xpathLeaveButton]])

if not driver.is_mobile: # TODO: make leave button work the same way on mobile as it does on web
  # Chat should be hidden, verify chat with admin button is available after leaving admin chat
  driver.FindElement([[By.NAME, 'create-admin-chat-button']])

  # Reopen admin chat
  driver.Click([[By.NAME, 'create-admin-chat-button']]) 

# Verify original message is still in chat room
driver.ExpectContains([
  [By.NAME, 'chat-card'], 
  [By.NAME, 'message-%s-Hi im %s, how do i know if im the possessed zombie?' % (chatName, actingPlayerName)], 
  [By.CLASS_NAME, 'message-bubble']], 
  'Hi im %s, how do i know if im the possessed zombie?' % actingPlayerName)

driver.Quit()
