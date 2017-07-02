#!/usr/bin/python
#
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""TODO: High-level file comment."""

import sys


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
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
	printAndRun("python modifygame.py %s" % args)
	printAndRun("python mission.py %s" % args)
	printAndRun("python checkin.py %s" % args)
	printAndRun("python changeallegiance.py %s" % args)
	printAndRun("python adminchat.py %s" % args)
	printAndRun("python globalchat.py %s" % args)
	printAndRun("python declare.py %s" % args)
	# printAndRun("python startgame.py %s" % args)
	printAndRun("python chat.py %s" % args)
	printAndRun("python chatpage.py %s" % args)
	printAndRun("python notifications1.py %s" % args)


	if not useMobile:
		printAndRun("python rewardcategories.py %s" % args)
		printAndRun("python chatEdgeCases.py %s" % args)


def desktopAndMobileTests(clientUrl, password, useRemote):
	#runTest(clientUrl, password, useRemote, useMobile=True)
	runTest(clientUrl, password, useRemote, useMobile=False)

def fakeAndRemoteTests(clientUrl, password):
	# desktopAndMobileTests(clientUrl, password, useRemote=True)
	desktopAndMobileTests(clientUrl, password, useRemote=False)

def main():
	# Default args
	clientUrl = 'http://localhost:5000'
	password = "whatever"
	if len(sys.argv) >= 2:
		clientUrl = sys.argv[1]
	if len(sys.argv) >= 3:
		password = sys.argv[2]
	fakeAndRemoteTests(clientUrl, password)

if __name__ == "__main__":
    main()
