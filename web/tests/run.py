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
import subprocess
from subprocess import PIPE
import os
import argparse
import shelve

def main(argv):
    pass

if __name__ == '__main__':
    main(sys.argv)

def generateTest(url, password, files, useRemote, useMobile):
	args = "--url %s --password %s" % (url, password)

	if useRemote:
		args += " -r"
	if useMobile:
		args += " -m"

	testFiles = [
		"acks",
		"ackrequests",
		"adminchat",
		"adminguns",
		"adminplayers",
		"changeallegiance",
		"chat",
		"chatlocation",
		"chatownerleaves",
		"chatpage",
		"creategame",
		"deactivate",
		"declare",
		"declareregularzombie",
		"globalchat",
		"infect",
		"joingame",
		"mission",
		"modifygame",
		"notifications1",
		"othersleavingresistance",
		"possession",
		"rewardcategories",
		"selfinfect",
		"signout",
		"startgame",
		"stuntimer",
	]

	if len(files) > 0:
		if files[0] == "not":
			for file in files[1:]:
				testFiles.remove(file)
		else:
			testFiles = files

	allTests = []

	for file in testFiles:
		allTests.append("python %s.py %s" % (file, args))
	return allTests

def desktopAndMobileTests(url, password, mobile, desktop, files, useRemote):
	allTests = []
	if mobile:
		allTests += generateTest(url, password, files, useRemote, useMobile=True)
	if desktop:
		allTests += generateTest(url, password, files, useRemote, useMobile=False)
	if not mobile and not desktop:
		allTests += generateTest(url, password, files, useRemote, useMobile=True)
		allTests += generateTest(url, password, files, useRemote, useMobile=False)
	return allTests

def fakeAndRemoteTests(url, password, mobile, desktop, local, remote, files):
	allTests = []
	if local:
		allTests += desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=False)
	if remote:
		allTests += desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=True)
	if not local and not remote:
		allTests += desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=False)
		allTests += desktopAndMobileTests(url, password, mobile, desktop, files, useRemote=True)
	return allTests

def runAll(allTests, maxParallel=3):
	finished = 0
	processes = []
	for test in allTests:
		if len(processes) - finished >= maxParallel:
			os.wait()
			finished += 1
		print("Running %s" % test)
		newProcess = subprocess.Popen(test, shell=True, stdout=PIPE)
		processes.append(newProcess)
	return [allTests[i] for i in range(len(allTests)) if not "done" in processes[i].communicate()[0]]


def runAllSequentially(allTests):
	failedTests = []
	for test in allTests:
		print("Running %s" % test)
		if os.system(test) != 0:
			failedTests.append(test)
	return failedTests

def rerunFailures(savedData, sequential, maximumParallel):
	if "failedTests" in savedData:
		if sequential:
			return runAllSequentially(savedData["failedTests"])
		else:
			max = None
			if maximumParallel:
				max = maximumParallel
			elif savedData.has_key("maxParallel"):
				max = savedData["maxParallel"]
			else:
				max = 3
			return runAll(savedData["failedTests"], max)
	else:
		print "No failed tests saved."

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument("-u", "--url", help="Client URL", default="http://localhost:5000")
	parser.add_argument("-p", "--password", help="Remote password", default="hi")
	parser.add_argument("-m", "--mobile", help="Only run mobile tests", action="store_true")
	parser.add_argument("-d", "--desktop", help="Only run desktop tests", action="store_true")
	parser.add_argument("-l", "--local", help="Only run local tests", action="store_true")
	parser.add_argument("-r", "--remote", help="Only run remote tests", action="store_true")
	parser.add_argument("-s", "--sequential", help="Run tests one at a time (by default, they run in parallel)", action="store_true")
	parser.add_argument("-rr", "--rerun", help="Run tests with the same flags used last time", action="store_true")
	parser.add_argument("-rf", "--rerunFailures", help="Reruns tests that failed the last time.", action="store_true")
	parser.add_argument("-cp", "--changePassword", help="Change the default remote password")
	parser.add_argument("-max", "--maximumParallel", type=int, help="The maximum number of tests which will run in parallel at once", default=3)
	parser.add_argument("-cmp", "--changeMaxParallel", help="Change the default maximum number of tests which run in parallel at once.")
	parser.add_argument("files", nargs="*", help="Specific tests to run")
	args = parser.parse_args()

	savedData = shelve.open("testdata")
	try:
		if savedData.has_key("password"):
			args.password = savedData["password"]

		if args.changePassword:
			savedData["password"] = args.changePassword
		elif args.changeMaxParallel:
			savedData["maxParallel"] = args.changeMaxParallel
		else:
			failedTests = None
			if args.rerunFailures:
				failedTests = rerunFailures(savedData, args.sequential, args.maximumParallel)
			else:
				if args.rerun:
					if "lastRun" in savedData:
						args = savedData["lastRun"]
					else:
						print "No previous run saved."
						return
				else:
					savedData["lastRun"] = args
				allTests = fakeAndRemoteTests(args.url, args.password, args.mobile, args.desktop, args.local, args.remote, args.files)
				
				if args.sequential:
					failedTests = runAllSequentially(allTests)
				else:
					maxParallel = None
					if args.maximumParallel:
						maxParallel = args.maximumParallel
					elif savedData.has_key("maxParallel"):
						maxParallel = savedData["maxParallel"]
					failedTests = runAll(allTests, maxParallel)
					
			print("%d FAILED TESTS:" % len(failedTests), failedTests)
			savedData["failedTests"] = failedTests
	finally:
		savedData.close()

if __name__ == "__main__":
    main()
