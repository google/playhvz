import sys
from driver import WholeDriver
from selenium.webdriver.common.by import By

try:

  # Sign in as an admin
  driver = WholeDriver(
    user="zella")

  # Admin adds gun
  # driver.Click([[By.NAME, 'drawerAdmin Guns']])
  # driver.Click([[By.ID, 'add']])
  # driver.SendKeys(
  #       [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
  #       '3.14')
  # # TODO - Add cancel in here
  # driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])

  # # View added gun
  # driver.ExpectContains([[By.NAME, 'gun-row-3.14']], "3.14")

  # # Assign player a gun
  # driver.Click([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'pencil']])
  # # TODO - check that the dropdowns show up
  # driver.SendKeys(
  #       [[By.NAME, 'gun-row-3.14'], [By.TAG_NAME, 'input']],
  #       'Jack Slayer the Bean Slasher')
  # driver.Click([[By.NAME, 'gun-row-3.14'], [By.ID, 'setButton']])

  # # Show that player shows up as having the gun
  # driver.ExpectContains([[By.NAME, 'gun-row-3.14'], [By.CLASS_NAME, 'player-label']], "Jack Slayer the Bean Slasher")

  # Add another gun, assign to another player
  # driver.Click([[By.ID, 'add']])
  # driver.SendKeys(
  #       [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
  #       ' ') # (I'm guessing) the lowest ID (alpabetically I could choose)
  # driver.Click([[By.ID, 'gunForm'],[By.ID, 'done']])
  # driver.Click([[By.NAME, 'gun-row- '], [By.CLASS_NAME, 'pencil']])
  # driver.SendKeys(
  #       [[By.NAME, 'gun-row- '], [By.TAG_NAME, 'input']],
  #       'Moldavi the Moldavish') #TODO - select by clicking the dropdown instead
  # driver.Click([[By.NAME, 'gun-row- '], [By.ID, 'setButton']])

  # Sort by label - show that they swap
  # Sort by player - show that they swap
  # Change the weapon ID, and show that that shows up
  #####driver.Click([[By.NAME, 'gun-row-3.14'], [By.ID, 'menu']])
  # driver.SendKeys(
  #       [[By.ID, 'form-section-create-gun'], [By.TAG_NAME, 'input']],
  #       '42')
  # driver.ExpectContains([[By.NAME, 'gun-row-42']], "42")
   
  # TODO - when implemented, have a player see that they've been assigned a gun
   
  # Admin - set got equipment for Jack
  driver.Click([[By.NAME, 'drawerAdmin Players']])
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'menu']]) # This is Jack (non-admin, human)
  driver.Click([[By.NAME, 'player-row-player-4'], [By.NAME, 'menu-item-Set Got Equipment']])
  driver.ExpectContains([[By.NAME, 'player-row-player-4'], [By.ID, 'gotEquipment']], "Yes")

  # Check Jack's profile, make sure the change showed up
  driver.Click([[By.NAME, 'player-row-player-4'], [By.ID, 'name']])
  driver.ExpectContains([[By.ID, 'got-equipment']], "Yes")

  # If you set the equipment of someone who already has it, nothing should happen
  # driver.Click([[By.NAME, 'drawerAdmin Players']])
  # driver.Click([[By.NAME, 'player-row-4'], [By.ID, 'menu']]) # This is Jack (non-admin, human)
  # driver.Click([[By.NAME, 'player-row-4'], [By.NAME, 'menu-item-Set Got Equipment']])
  # driver.ExpectContains([[By.NAME, 'player-row-4'], [By.ID, 'gotEquipment']], "Yes")

  # Unset Jack's equipment



  # Admin - set not got equipment
  # Stack by equipment - show swap
  # Search by equipment - show only one
  # Add note
  # Search by note
  # Stack by note

finally:
  # driver.Quit()
  pass
