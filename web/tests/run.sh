#!/bin/bash -eu
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

# TODO: High-level file comment.


client_url=$1
password=$2

if [ -z $client_url ]
then
	echo "Usage: $0 webserverurlhere passwordhere"
	exit
fi

if [ -z $password ]
then
	echo "Usage: $0 webserverurlhere passwordhere"
fi

print_and_run() {
	echo Running: $1
	$1
}

run_test() {
	client_url=$1
	password=$2
	use_remote=$3
	use_mobile=$4

	args="--url $client_url --password $password "

	if [ $use_remote == 1 ]
	then
		args="$args -r"
	fi

	if [ $use_mobile == 1 ]
	then
		args="$args -m"
	fi

	print_and_run "python creategame.py $args"
	print_and_run "python joingame.py $args"
	print_and_run "python infect.py $args"
	print_and_run "python declare.py $args"
	print_and_run "python chat.py $args"
	print_and_run "python adminchat.py $args"
	print_and_run "python globalchat.py $args"
	print_and_run "python chatpage.py $args"
	print_and_run "python modifygame.py $args"
	print_and_run "python mission.py $args"
	print_and_run "python checkin.py $args"
	print_and_run "python changeallegiance.py $args"
	# print_and_run "python startgame.py $args"
	print_and_run "python rewardcategories.py $args"
	print_and_run "python chatEdgeCases.py $args"
}

desktop_and_mobile_tests() {
	client_url=$1
	password=$2
	use_remote=$3
	use_mobile=0
	run_test $client_url $password $use_remote $use_mobile
	# use_mobile=1
	# run_test $client_url $password $use_remote $use_mobile
}

fake_and_remote_tests() {
	client_url=$1
	password=$2
	use_remote=0
	desktop_and_mobile_tests $client_url $password $use_remote
	use_remote=1
	desktop_and_mobile_tests $client_url $password $use_remote
}

fake_and_remote_tests $client_url $password
