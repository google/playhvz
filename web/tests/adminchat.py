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

  def testCreateAdminChat(adminPlayers, nonAdminPlayers):
    try: 

      actingPlayer = nonAdminPlayers[0]
      driver.SwitchUser(actingPlayer)

      driver.Click([[By.NAME, 'drawerChat']]) # Change to chat page

      driver.FindElement([[By.NAME, 'admin-chat']]) # Check that the admin chat button exists
      driver.Click([[By.NAME, 'admin-chat']])
      chatName = playerNames[actingPlayer] + ' & HvZ CDC'
      driver.FindElement([[By.NAME, 'ChatRoom: %s' % chatName]]) # Check that the chat exists

      # TODO: dom-if hides the element, so it's there but hidden which is probably why
      # DontFindElement finds it
      #driver.DontFindElement([[By.NAME, 'admin-chat']]) # Check that the admin chat button is gone

      for admin in adminPlayers:
        driver.SwitchUser(admin)
        driver.FindElement([[By.NAME, 'drawer-' + chatName]])

      #raise AssertionError("Test still in development, this is expected")
      
    finally:
      pass

  # Run admin test
  adminPlayers = ['zella', 'moldavi']
  nonAdminPlayers = ['deckerd', 'drake', 'zeke', 'jack']
  testCreateAdminChat(adminPlayers, nonAdminPlayers)

  driver.Quit()

finally:
  pass
