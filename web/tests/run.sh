
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
	# print_and_run "python declare.py $args"
	print_and_run "python chat.py $args"
	print_and_run "python adminchat.py $args"
	print_and_run "python modifygame.py $args"
	print_and_run "python checkin.py $args"
	print_and_run "python changeallegiance.py $args"
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
	# use_remote=0
	# desktop_and_mobile_tests $client_url $password $use_remote
	use_remote=1
	desktop_and_mobile_tests $client_url $password $use_remote
}

fake_and_remote_tests $client_url $password
