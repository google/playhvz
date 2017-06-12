import sys
from driver import WholeDriver
from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = WholeDriver(
    user="zella")

  ######################  Testing Admin Guns Page  ######################

  # Admin adds gun
  driver.Click([[By.NAME, 'drawerAdmin Guns']])
  driver.Click([[By.ID, 'add']])
  driver.SendKeys(
        [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
        '3.14')
 
  driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])

  # View added gun
  driver.ExpectContains([[By.NAME, 'gun-row-3.14']], "3.14")

  # Assign player a gun
  driver.Click([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'pencil']])
  # TODO - check that the dropdowns show up
  driver.SendKeys(
        [[By.NAME, 'gun-row-3.14'], [By.TAG_NAME, 'input']],
        'Jack Slayer the Bean Slasher')
  driver.Click([[By.NAME, 'gun-row-3.14'], [By.ID, 'setButton']])

  # Show that player shows up as having the gun
  driver.ExpectContains([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'player-label']], "Jack Slayer the Bean Slasher")

  #Add another gun, assign to another player
  driver.Click([[By.ID, 'add']])
  driver.SendKeys(
        [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
        'pancake')
  driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])
  driver.Click([[By.NAME, 'gun-row-pancake'], [By.CLASS_NAME, 'pencil']])
  driver.SendKeys(
        [[By.NAME, 'gun-row-pancake'], [By.TAG_NAME, 'input']],
        'Moldavi the Moldavish') #TODO - select by clicking the dropdown instead
  driver.Click([[By.NAME, 'gun-row-pancake'], [By.ID, 'setButton']])

  # Search by label
  driver.Click([[By.NAME, 'header-Label'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Label'], [By.TAG_NAME, 'input']],
        'pan')
  driver.ExpectContains([[By.ID, 'table']], "Moldavi")
  driver.ExpectContains([[By.ID, 'table']], "Jack", False)
  driver.Backspace([[By.NAME, 'header-Label'], [By.TAG_NAME, 'input']], 3)

  # Search by player
  driver.Click([[By.NAME, 'header-Player'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Player'], [By.TAG_NAME, 'input']],
        'Jack')
  driver.ExpectContains([[By.ID, 'table']], "Jack")
  driver.ExpectContains([[By.ID, 'table']], "Moldavi", False)
  driver.Backspace([[By.NAME, 'header-Player'], [By.TAG_NAME, 'input']], 4)

  # THEORETICALLY WORKS, BUT NO PROMISES SINCE ITS CURRENTLY BROKEN SO I CAN'T TEST
  # Uncomment this block later
  #Change the weapon ID, and show that it shows up
  # driver.Click([[By.NAME, 'gun-row-3.14'], [By.ID, 'menu']])
  # driver.Click([[By.NAME, 'gun-row-3.14'], [By.NAME, 'menu-item-Edit']])
  # driver.SendKeys(
  #       [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
  #       '42')
  # driver.Click([[By.ID, 'gunForm'], [By.ID, 'done']])
  ### driver.ExpectContains([[By.NAME, 'gun-row-42']], "42")
   
  # TODO - when implemented, have a player see that they've been assigned a gun
   


  ######################  Testing Admin Players Page  ######################


  # Admin - set got equipment for Jack
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'menu']]) # This is Jack (non-admin, human)
  driver.Click([[By.NAME, 'player-row-player-4'], [By.NAME, 'menu-item-Set Got Equipment']])
  driver.ExpectContains([[By.NAME, 'player-row-player-4'], [By.ID, 'gotEquipment']], "Yes")

  # Check Jack's profile, make sure the change showed up
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'name']])
  driver.ExpectContains([[By.NAME, 'got-equipment']], "Yes")

  # If you set the equipment of someone who already has it, nothing should happen
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'menu']]) # This is Jack (non-admin, human)
  driver.Click([[By.NAME, 'player-row-player-4'], [By.NAME, 'menu-item-Set Got Equipment']])
  driver.ExpectContains([[By.NAME, 'player-row-player-4'], [By.ID, 'gotEquipment']], "Yes")

  # Unset Jack's equipment
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'menu']]) # This is Jack (non-admin, human)
  driver.Click([[By.NAME, 'player-row-player-4'], [By.NAME, 'menu-item-Unset Got Equipment']]) #SOMETIMES CRASHES ON THIS LINE
  driver.ExpectContains([[By.NAME, 'player-row-player-4'], [By.ID, 'gotEquipment']], "No") #WEIRD...SOMETIMES CRASHES HERE!!!

  # Check Jack's profile, make sure the change showed up
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'name']])
  driver.ExpectContains([[By.NAME, 'got-equipment']], "No")

  # Go back to the Admin Guns page
  driver.Click([[By.NAME, 'drawerAdmin Players']])

  # Search by number
  driver.Click([[By.NAME, 'header-#'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-#'], [By.TAG_NAME, 'input']],
        '3')
  driver.ExpectContains([[By.NAME, 'player-table']], "Jack") # Jack should show up
  driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd", False) # Deckerd shouldn't show up
  driver.Backspace([[By.NAME, 'header-#'], [By.TAG_NAME, 'input']])

  # # Search by name
  driver.Click([[By.NAME, 'header-Name'], [By.NAME, 'icon-search']])
  driver.SendKeys(
        [[By.NAME, 'header-Name'], [By.TAG_NAME, 'input']],
        'Deckerd')
  driver.ExpectContains([[By.NAME, 'player-table']], "Deckerd") # Deckerd should show up
  driver.ExpectContains([[By.NAME, 'player-table']], "Jack", False) # Jack shouldn't show up
  driver.Backspace([[By.NAME, 'header-Name'], [By.TAG_NAME, 'input']], 7)

  # TODO - search by equipment once this works

  # TODO - add a note (once it's the right style)

  # TODO - once we can add notes, search by notes

finally:
  # driver.Quit()
  pass
