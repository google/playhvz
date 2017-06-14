import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella")

try:

	############## ADD A MISSION FOR THE HUMANS ##############

	driver.Click([[By.NAME, 'drawerAdmin Missions']])
	driver.Click([[By.ID, 'add']])
	driver.SendKeys([[By.ID, 'form-section-mission-name'],[By.TAG_NAME, 'input']],
      'insert witty and entertaining name here')

	#driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
	driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'year'],[By.TAG_NAME, 'input']],
      '2012')
	#driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
	driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'month'],[By.TAG_NAME, 'input']],
      '10')
	#driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
	driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'day'],[By.TAG_NAME, 'input']],
      '20')
	#driver.Backspace([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 6)
	driver.SendKeys([[By.ID, 'form-section-mission-begin'],[By.ID, 'time'],[By.TAG_NAME, 'input']],
      '12')

	#driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
	driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'year'],[By.TAG_NAME, 'input']],
      '2012')
	#driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']])
	driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'month'],[By.TAG_NAME, 'input']],
      '10')
	#driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']], 2)
	driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'day'],[By.TAG_NAME, 'input']],
      '20')
	#driver.Backspace([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']], 6)
	driver.SendKeys([[By.ID, 'form-section-mission-end'],[By.ID, 'time'],[By.TAG_NAME, 'input']],
      '12')

	driver.SendKeys([[By.ID, 'form-section-mission-details'],[By.TAG_NAME, 'textarea']],
      '<div>take over the world</div>')

	driver.Click([[By.ID, 'form-section-mission-group'], [By.TAG_NAME, 'input']])
	driver.Click([[By.NAME, 'group-resistance-6']])

	driver.Click([[By.ID, 'missionForm'], [By.ID, 'done']])


	# Add a mission for the zombies.

	
	# Edit the mission for the humans.

	###driver.Quit()

finally:
	pass