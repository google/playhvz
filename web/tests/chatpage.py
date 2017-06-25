import setup
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Test Setup
playerNames = {
        'zella': 'ZellaTheUltimate',
        'deckerd': 'DeckerdTheHesitant',
        'moldavi': 'MoldaviTheMoldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'JackSlayerTheBeanSlasher'
      }

def getPathToElement(playerName, tag, name):
  xpathForPageElement = "//*[contains(@id, 'chat-page-%s')]//%s[contains(@name, '%s')]"
  return xpathForPageElement % (playerName, tag, name)

def changeToPage(driver, drawerOption):
  driver.Click([[By.NAME, 'drawer' + drawerOption]])

def closeNotifications(driver):
  driver.Click([[By.NAME, 'close-notification']])

def toggleChatDrawer(driver, actingPlayer, chatRoomName):
  xpathChatDrawerButton = getPathToElement(actingPlayer, 'paper-icon-button', 'chat-info-' + chatRoomName)
  driver.Click([[By.XPATH, xpathChatDrawerButton]])  

# Start Test
actingPlayer = 'zeke' # non-admin human
actingPlayerName = playerNames[actingPlayer]
newChatName = 'No hoomans allowed'
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

# Open chat page
driver.SwitchUser(actingPlayer)
driver.Click([[By.NAME, 'drawerChat']])

# Open dialog for creating new chat room
driver.FindElement([[By.ID, 'new-chat']])
driver.Click([[By.ID, 'new-chat']])

# Set chat room settings to be zombie only
driver.FindElement([[By.ID, 'chatName']])
driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], newChatName)
driver.Click([[By.ID, 'allegianceFilter']])
driver.Click([[By.ID, 'settingsForm'], [By.ID, 'done']])

# Check the newly created chat room is opened
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, newChatName]])

# Add a zombie to chat
toggleChatDrawer(driver, actingPlayerName, newChatName)
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.Click([[By.XPATH, xpathAdd]])
driver.FindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup']])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup'], [By.TAG_NAME, 'input']], playerNames['drake'])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup'], [By.TAG_NAME, 'input']], Keys.RETURN)

# Check drawer to see that zombie was added
driver.FindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['drake']]])

# Make sure human can't be added to chat
driver.Click([[By.XPATH, xpathAdd]])
driver.FindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup']])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup'], [By.TAG_NAME, 'input']], playerNames['jack'])
driver.SendKeys([[By.TAG_NAME, 'ghvz-chat-page'], [By.ID, 'lookup'], [By.TAG_NAME, 'input']], Keys.RETURN)
driver.DontFindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['jack']]])

# Close chat drawer before typing a message
toggleChatDrawer(driver, actingPlayerName, newChatName)

# Message the chat 
xpathTextarea = getPathToElement(actingPlayerName, 'textarea', 'input-' + newChatName)
xpathSend = getPathToElement(actingPlayerName, 'paper-button', 'submit-' + newChatName)
driver.SendKeys([[By.NAME, 'input-%s' % newChatName], [By.XPATH, xpathTextarea]], 'Whats our plan?')
driver.Click([[By.NAME, 'submit-%s' % newChatName], [By.XPATH, xpathSend]])

# Check that other player can see the message
driver.SwitchUser('drake')
changeToPage(driver, '-' + newChatName)
driver.ExpectContains([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, 'message-%s-Whats our plan?' % newChatName], [By.CLASS_NAME, 'message-text']], 
'Whats our plan?')

# Switch back to original player
driver.SwitchUser(actingPlayer)
changeToPage(driver, '-' + newChatName)
toggleChatDrawer(driver, actingPlayerName, newChatName)

# Kick player from chat
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.ID, 'kick-' + playerNames['drake']]])
driver.Click([[By.ID, 'chat-page-' + actingPlayerName], [By.ID, 'kickForm'], [By.ID, 'done']])

# Confirm player was kicked
driver.DontFindElement([[By.TAG_NAME, 'ghvz-chat-page'], [By.NAME, playerNames['drake']]])

# Leave the chat
xpathLeaveButton = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeaveButton]])
driver.Click([[By.XPATH, xpathLeaveButton]])

xpathLeaveDialog = getPathToElement(actingPlayerName, '*', 'chat-leave-dialog-' + newChatName)
driver.FindElement([[By.XPATH, xpathLeaveDialog]])
driver.Click([[By.XPATH, xpathLeaveDialog], [By.ID, 'done']])
driver.DontFindElement([[By.XPATH, xpathLeaveDialog]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, newChatName]])
      
driver.Quit()