import setup
from selenium.webdriver.common.by import By

driver = setup.MakeDriver(user="zella", page="/createGame", populate=False)

try:

  # Create game
  driver.Click([[By.ID, 'createGame']])
  driver.SendKeys(
    [[By.ID, 'idInput'], [By.TAG_NAME, 'input']], driver.GetGameId())
  driver.SendKeys(
    [[By.ID, 'nameInput'], [By.TAG_NAME, 'input']], 'My Game')
  driver.SendKeys(
    [[By.ID, 'stunTimerInput'], [By.TAG_NAME, 'input']], '60')
  # Set game start time to sometime in the past
  driver.Backspace([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  driver.SendKeys([[By.ID, 'form-section-start-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2016")

  # Set the declare resistance and declare horde end times to sometime in the future
  # driver.Backspace([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  # driver.SendKeys([[By.ID, 'form-section-declare-resistance-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2018")

  # driver.Backspace([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], 4)
  # driver.SendKeys([[By.ID, 'form-section-declare-horde-end-time'],[By.ID, 'year'],[By.TAG_NAME, 'input']], "2018")

  driver.Click([[By.ID, 'gameForm'], [By.ID, 'done']])
  
  driver.WaitForGameLoaded()

  # Have a player join the game
  driver.SwitchUser("reggie")

  if not driver.is_mobile:
    driver.Click([[By.NAME, 'joinGame']])

  driver.SendKeys(
      [[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-input'], [By.TAG_NAME, 'input']],
      'ReggieTheRavager')
  driver.Click([[By.NAME, 'joinGameNamePage'], [By.TAG_NAME, 'paper-button']])
  driver.Click([[By.NAME, 'joinGameBlasterPage'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'joinGameTakePhotos'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'joinGameBeVolunteerPage'], [By.NAME, 'option2']])
  driver.Click([[By.TAG_NAME, 'ghvz-game-registration'], [By.NAME, 'submitJoinGame']])

  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])

  # Check that the leaderboard has the person show up with 0 points
  driver.Click([[By.NAME, 'drawerLeaderboard']])
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Name Cell ReggieTheRavager']], 'ReggieTheRavager')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Allegiance Cell ReggieTheRavager']], 'undeclared')
  driver.ExpectContains(
      [[By.NAME, 'leaderboard-card'], [By.NAME, 'Leaderboard Points Cell ReggieTheRavager']], '0')

  if driver.is_mobile:
    driver.Click([[By.NAME, 'leaderboard-card'], [By.NAME, 'drawerButton']])

  # Declare allegiance as a human
  driver.Click([[By.NAME, 'drawerDashboard']])
  driver.Click([[By.NAME, 'declareAllegiance']])
  driver.Click([[By.NAME, 'joinGameStartingZombiePage'], [By.NAME, 'option0']])
  driver.Click([[By.NAME, 'joinGameSecretZombiePage'], [By.NAME, 'option1']])
  driver.Click([[By.NAME, 'startQuizPage'], [By.NAME, 'offWeGo']])

  driver.Click([[By.TAG_NAME, 'ghvz-declare-page'], [By.NAME, 'submitJoinGame']])

  # Player sees their lifecode and allegiance
  if driver.is_mobile:
    driver.Click([[By.NAME, 'mobile-main-page'], [By.NAME, 'drawerButton']])
  driver.Click([[By.NAME, 'drawerMy Profile']])
  driver.ExpectContains([[By.NAME, 'status']], 'Alive')
  driver.ExpectContains([[By.NAME, 'lifecode']], 'codefor-life-1')

  driver.Quit()

finally:
  pass
