import setup
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = setup.MakeDriver(user="zella")

  driver.Click([[By.NAME, 'close-notification']])

  # Give Zella a reward (just so that she has moe points than Moldavi)
  driver.SendKeys([[By.NAME, 'rewards-box'], [By.TAG_NAME, 'input']], 'signed 1')
  driver.Click([[By.NAME, 'rewards-box'], [By.ID, 'claim']])

  # Switch to a normal human (Jack)

  driver.SwitchUser('jack')

  driver.Click([[By.NAME, 'close-notification']])

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  # Jack creates his own personal chatroom with no other players
  driver.Click([[By.NAME, 'drawerChat']])
  driver.Click([[By.ID, 'new-chat']])
  driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], 'Secret Stuff')
  driver.Click([[By.ID, 'allegianceFilter'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'canAddOthers'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'settingsForm'], [By.ID, 'dialog'], [By.ID, 'done']])
  driver.FindElement([[By.NAME, 'drawer-Secret Stuff']])

  # Jack creates a chatroom with other players
  driver.Click([[By.NAME, 'drawerChat']])
  driver.Click([[By.ID, 'new-chat']])
  driver.SendKeys([[By.ID, 'chatName'], [By.TAG_NAME, 'input']], "Humanity's Last Hope")
  driver.Click([[By.ID, 'allegianceFilter'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'canAddOthers'], [By.ID, 'checkboxContainer']])
  driver.Click([[By.ID, 'settingsForm'], [By.ID, 'dialog'], [By.ID, 'done']])
  driver.FindElement([[By.NAME, "drawer-Humanity's Last Hope"]]) #MOBILE?
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-info-Humanity's Last Hope"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "player-name-MoldaviTheMoldavish"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "player-name-ZellaTheUltimate"]])


  # Jack gets infected by Drake
  driver.SwitchUser('drake')
  driver.SendKeys(
      [[By.ID, 'lifeCodeInput'], [By.TAG_NAME, 'input']],
      'grobble forgbobbly')

  driver.Click([[By.ID, 'infect']])

  # Jack shouldn't see either chat anymore
  driver.FindElement([[By.NAME, 'drawer-Secret Stuff']], should_exist=False)
  driver.FindElement([[By.NAME, "drawer-Humanity's Last Hope"]], should_exist=False)

  # Sign in as Zella, make sure she's the owner
  driver.SwitchUser('zella')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerChat']])

  # Open the drawer of each to check that Zella can add/bump people (i.e. is the owner)
  driver.Click([[By.TAG_NAME, 'ghvz-chat-room-list'], [By.NAME, "Humanity's Last Hope"]])
  driver.Click([[By.NAME, 'chat-card'], [By.NAME, "chat-info-Humanity's Last Hope"]])

  # Bump Moldavi
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], 
  	[By.NAME, "chat-drawer-Humanity's Last Hope"], 
  	[By.NAME, 'MoldaviTheMoldavish'], 
  	[By.TAG_NAME, 'paper-icon-button']])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], 
  	[By.NAME, "chat-drawer-Humanity's Last Hope"], 
  	[By.NAME, 'MoldaviTheMoldavish'], 
  	[By.ID, 'kick-MoldaviTheMoldavish']])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.ID, 'kickForm'], [By.ID, 'done']])

  # Add Moldavi back in
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.NAME, "chat-drawer-add"]])
  driver.Click([[By.NAME, "chat-room-Humanity's Last Hope"], [By.NAME, "player-name-MoldaviTheMoldavish"]])








finally:
	pass