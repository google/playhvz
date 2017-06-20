import sys
import os


def printAndRun(command):
	print("Running %s" % command)
	os.system(command)

def runTest(clientUrl, password, useRemote, useMobile):
	args = "--url %s --password %s" % (clientUrl, password)

	if useRemote:
		args += " -r"
	if useMobile:
		args += " -m"

	printAndRun("python creategame.py %s" % args)
	printAndRun("python joingame.py %s" % args)
	printAndRun("python infect.py %s" % args)
	printAndRun("python chat.py %s" % args)
	printAndRun("python modifygame.py %s" % args) # problem - faq doesn't save (web or mobile) (currently tests pass, but only b/c part is commented out)
	printAndRun("python mission.py %s" % args)
	printAndRun("python checkin.py %s" % args)
	printAndRun("python changeallegiance.py %s" % args)

	# As soon as this features is visible we can run them all. 
	if not useMobile:
		printAndRun("python declare.py %s" % args) # problem - declare isn't visible on mobile
		printAndRun("python startgame.py %s" % args) # problem - declare isn't visible on mobile (don't run it on mobile)

def desktopAndMobileTests(clientUrl, password, useRemote):
	# runTest(clientUrl, password, useRemote, useMobile=True)
	runTest(clientUrl, password, useRemote, useMobile=False)

def fakeAndRemoteTests(clientUrl, password):
	#desktopAndMobileTests(clientUrl, password, useRemote=True)
	desktopAndMobileTests(clientUrl, password, useRemote=False)

def main():
	# Default args
	clientUrl = 'http://localhost:5000'
	password = "whatever"
	if len(sys.argv) >= 2:
		clientUrl = sys.argv[1]
	if len(sys.argv) >= 3:
		clientUrl = sys.argv[2]
	fakeAndRemoteTests(clientUrl, password)

if __name__ == "__main__":
    main()
