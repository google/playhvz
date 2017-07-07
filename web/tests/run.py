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
import os
import argparse

def main(argv):
    pass

if __name__ == '__main__':
    main(sys.argv)

def printAndRun(command):
	print("Running %s" % command)
	os.system(command)

def runTest(url, password, files, useRemote, useMobile):
	args = "--url %s --password %s" % (url, password)

	if useRemote:
		args += " -r"
	if useMobile:
		args += " -m"

	if len(files) > 0:
		for file in files:
			printAndRun("python %s.py %s" % (file, args))
	else:
		printAndRun("python creategame.py %s" % args)
		printAndRun("python joingame.py %s" % args)
		printAndRun("python infect.py %s" % args)
		printAndRun("python othersleavingresistance.py %s" % args)
		printAndRun("python modifygame.py %s" % args)
		printAndRun("python mission.py %s" % args)
		printAndRun("python adminplayers.py %s" % args)
		printAndRun("python adminguns.py %s" % args)
		printAndRun("python changeallegiance.py %s" % args)
		printAndRun("python adminchat.py %s" % args)
		printAndRun("python globalchat.py %s" % args)
		printAndRun("python declare.py %s" % args)
		printAndRun("python startgame.py %s" % args)
		printAndRun("python chat.py %s" % args)
		printAndRun("python chatpage.py %s" % args)
		printAndRun("python notifications1.py %s" % args)
		printAndRun("python rewardcategories.py %s" % args)
		printAndRun("python chatEdgeCases.py %s" % args)
		printAndRun("python deactivate.py %s" % args)
		printAndRun("python chatlocation.py %s" % args)


def desktopAndMobileTests(url, password, mobile, desktop, files, useRemote):
	if mobile:
		runTest(url, password, files, useRemote, useMobile=True)
	if desktop:
		runTest(url, password, files, useRemote, useMobile=False)
	if not mobile and not desktop:
		runTest(url, password, files, useRemote, useMobile=True)
		runTest(url, password, files, useRemote, useMobile=False)

def fakeAndRemoteTests(url, password, mobile, desktop, local, remote, files):
	if local:
		desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=False)
	if remote:
		desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=True)
	if not local and not remote:
		desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=False)
		desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=True)


def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("-u", "--url", help="Client URL", default="http://localhost:5000")
	parser.add_argument("-p", "--password", help="Remote password", default="hi")
	parser.add_argument("-m", "--mobile", help="Only run mobile tests", action="store_true")
	parser.add_argument("-d", "--desktop", help="Only run desktop tests", action="store_true")
	parser.add_argument("-l", "--local", help="Only run local tests", action="store_true")
	parser.add_argument("-r", "--remote", help="Only run remote tests", action="store_true")
	parser.add_argument("files", nargs="*", help="Specific tests to run")
	args = parser.parse_args()

	fakeAndRemoteTests(args.url, args.password, args.mobile, args.desktop, args.local, args.remote, args.files)

if __name__ == "__main__":
    main()
