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
'''
    pip install -r requirements.txt -t lib --upgrade
'''

from oauth2client.client import OAuth2WebServerFlow
from oauth2client.tools import run_flow
from oauth2client.file import Storage
from oauth2client.tools import argparser
import client
import argparse
import sys
import time
from optparse import OptionParser
from selenium import webdriver
from selenium.webdriver.common.by import By

flow = OAuth2WebServerFlow(client_id=client.CLIENT_ID,
                           client_secret=client.CLIENT_SECRET,
                           scope='email',
                           redirect_uri='http://localhost:5000')

storage = Storage('creds.data')

parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[argparser])
flags = parser.parse_args(['--auth_host_name', 'localhost', '--auth_host_port', '6789'])

credentials = run_flow(flow, storage, flags)

print "access_token: %s" % credentials.access_token

parser = OptionParser()
parser.add_option("--url", dest="client_url", help="Url of the web server", default="localhost:5000")
parser.add_option("--password", dest="password", help="Password for the fake users, if using remote")
parser.add_option("-r", action="store_true", dest="use_remote", help="Hit an external backend/firebase instead of the in-memory fake.")
parser.add_option("-m", action="store_true", dest="is_mobile", help="Test as if using a mobile device.")
parser.add_option("-d", action="store_true", dest="use_dashboards", help="Test dashboard widgets instead of pages.")
(options, args) = parser.parse_args()

url = "%s/createGame?bridge=remote&signInMethod=accessToken&accessToken=%s" % (
    options.client_url,
    credentials.access_token)

selenium_driver = webdriver.Chrome()
selenium_driver.get(url)

element = None
for i in range(0, 10):
  element = selenium_driver.find_element(By.ID, 'realApp')
  if element is not None and element.get_attribute('signed-in') == "true":
    break
  time.sleep(1)
if element is None:
  raise 'Couldnt log in!'