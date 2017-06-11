import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver()
driver.WaitForGameLoaded()
driver.SwitchPage('chat')

try:
  playerNames = {
        'zella': 'Zella the Ultimate',
        'deckerd': 'Deckerd the Hesitant',
        'moldavi': 'Moldavi the Moldavish',
        'drake': 'Drackan',
        'zeke': 'Zeke',
        'jack': 'Jack Slayer the Bean Slasher'
      }

  adminNames = {
        'zella': 'Zella the Ultimate',
        'moldavi': 'Moldavi the Moldavish',
    }

  def testAdminChat(playersInChat, playersNotInChat, chatName):
    try: 

      print "hello there"
      
    finally:
      pass

  # HORDE CHAT ROOM - only declared zombies should view
  zombiePlayers = ['drake', 'zeke']
  nonZombiePlayers = ['reggie', 'minny', 'zella', 'deckerd', 'moldavi', 'jack']
  testAdminChat(zombiePlayers, nonZombiePlayers, 'Horde ZedLink')

  driver.Quit()

finally:
  pass
