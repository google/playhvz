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
from optparse import OptionParser
from driver import WholeDriver

def MakeDriver(user="zella", page="", populate=True):
	parser = OptionParser()
	parser.add_option("--url", dest="client_url", help="Url of the web server", default="localhost:5000")
	parser.add_option("--password", dest="password", help="Password for the fake users, if using remote")
	parser.add_option("-r", action="store_true", dest="use_remote", help="Hit an external backend/firebase instead of the in-memory fake.")
	parser.add_option("-m", action="store_true", dest="is_mobile", help="Test as if using a mobile device.")
	parser.add_option("-d", action="store_true", dest="use_dashboards", help="Test dashboard widgets instead of pages.")
	(options, args) = parser.parse_args()

	if options.use_remote:
		assert options.password

	return WholeDriver(
	    options.client_url,
	    options.is_mobile,
	    options.use_remote,
	    options.use_dashboards,
	    user,
	    options.password,
	    page,
	    populate)