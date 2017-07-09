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
import shelve

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

	testFiles = [
		"adminchat",
		"adminguns",
		"adminplayers",
		"changeallegiance",
		"chat",
		"chatEdgeCases",
		"chatlocation",
		"chatpage",
		"createGame",
		"deactivate",
		"declare",
		"globalchat",
		"infect",
		"joingame",
		"mission",
		"modifygame",
		"notifications1",
		"othersleavingresistance",
		"possession",
		"requests",
		"rewardcategories",
		"selfinfect",
		"startgame"
	]

	if len(files) > 0:
		if files[0] == "not":
			for file in files[1:]:
				testFiles.remove(file)
		else:
			testFiles = files


	for file in testFiles:
		printAndRun("python %s.py %s" % (file, args))

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
	#parser.add_argument("-rf", "--rerunFailures", help="Reruns tests that failed the last time.", action="store_true")
	#parser.add_argument("-cp", "--changePassword", help="Change the default remote password")
	parser.add_argument("files", nargs="*", help="Specific tests to run")
	args = parser.parse_args()

	# if args.cp:
	# 	dict = shelve.open("testdata")

	fakeAndRemoteTests(args.url, args.password, args.mobile, args.desktop, args.local, args.remote, args.files)

if __name__ == "__main__":
    main()
