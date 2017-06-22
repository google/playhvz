import setup
from selenium.webdriver.common.by import By

# Test Setup
playerNames = {
        'zella': 'ZellaTheUltimate',
        'deckerd': 'DeckerdTheHesitant',
        'moldavi': 'MoldaviTheMoldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'JackSlayerTheBeanSlasher'
      }

adminPlayers = ['zella', 'moldavi']
nonAdminPlayers = ['deckerd', 'drake', 'zeke', 'jack']

def getPathToElement(playerName, tag, name):
  xpathForPageElement = "//*[contains(@id, 'chat-page-%s')]//%s[contains(@name, '%s')]"
  return xpathForPageElement % (playerName, tag, name)

def changeToPage(driver, drawerOption):
  driver.Click([[By.NAME, 'drawer' + drawerOption]])

def closeNotifications(driver):
  driver.Click([[By.NAME, 'close-notification']])

def openChatDrawer(driver, actingPlayer, chatRoomName):
  xpathChatDrawerButton = getPathToElement(actingPlayer, 'paper-icon-button', 'chat-info-' + chatRoomName)
  driver.Click([[By.XPATH, xpathChatDrawerButton]])  


# Start Test
actingPlayer = 'zeke' # non-admin zombie
actingPlayerName = playerNames[actingPlayer]
driver = setup.MakeDriver()
driver.WaitForGameLoaded()

# Open chat page
driver.SwitchUser(actingPlayer)
driver.FindElement([[By.NAME, 'drawerChat']])
driver.Click([[By.NAME, 'drawerChat']])
driver.FindElement([[By.TAG_NAME, 'ghvz-chat-room-list']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.TAG_NAME, 'ghvz-chat-room']])

# Check zombie player is in global chat, 2 zombie chats, and no human-only chats
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chatRoom-everyone-1']]) # Global chat
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chatRoom-horde-3']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chatRoom-4']])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chatRoom-resistance-2']])

# Open Global Chat
driver.Click([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, 'chatRoom-everyone-1']])

# Open chat drawer
openChatDrawer(driver, actingPlayerName, 'Global Chat')

# Check non-admin can't add players
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.DontFindElement([[By.XPATH, xpathAdd]])

# Check non-admin can't leave chat
xpathLeave = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.DontFindElement([[By.XPATH, xpathLeave]])

## Check 6 players are in global chat and non-admin can't kick players
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zella']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zella']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['deckerd']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['moldavi']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['drake']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zeke']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['zeke']], [By.ID, 'trigger']])
driver.FindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['jack']]])
driver.DontFindElement([[By.ID, 'chat-page-%s' % actingPlayerName], [By.NAME, playerNames['jack']], [By.ID, 'trigger']])

## Test admins can add, leave, and kick from global chat
actingPlayer = 'zella' # admin human
actingPlayerName = playerNames[actingPlayer]

# Switch to chat page and open drawer
driver.SwitchUser(actingPlayer)
closeNotifications(driver)
changeToPage(driver, '-' + 'Global Chat')
openChatDrawer(driver, actingPlayerName, 'Global Chat')

# Check admin can add players
xpathAdd = getPathToElement(actingPlayerName, 'a', 'chat-drawer-add')
driver.FindElement([[By.XPATH, xpathAdd]])

# Check admin can leave chat
xpathLeave = getPathToElement(actingPlayerName, 'a', 'chat-drawer-leave')
driver.FindElement([[By.XPATH, xpathLeave]])

# Check admin can kick all 6 players
driver.DontFindElement([[By.NAME, playerNames['zella']], [By.ID, 'trigger']])
driver.DontFindElement([[By.NAME, playerNames['deckerd']], [By.ID, 'trigger']])
driver.DontFindElement([[By.NAME, playerNames['moldavi']], [By.ID, 'trigger']])
driver.DontFindElement([[By.NAME, playerNames['drake']], [By.ID, 'trigger']])
driver.DontFindElement([[By.NAME, playerNames['zeke']], [By.ID, 'trigger']])
driver.DontFindElement([[By.NAME, playerNames['jack']], [By.ID, 'trigger']])

driver.Quit()