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
from pyfcm import FCMNotification

SERVER_KEY = "AAAAkad6p4g:APA91bEUcIKcSeONQ2yYpQ0YtAIXqvYWD1vYwbESKQVNhMbtA79pOO842F8O6xQ0-MhNXMaCWd5xCs-LKtaH2f6WOMEqVlUkDUgJezyx2HjKoGhwsF7T92skiY-90cLmJFjJ8CRvd6Xe" 

push_service = FCMNotification(api_key=SERVER_KEY)
 
# Your api-key can be gotten from:  https://console.firebase.google.com/project/<project-name>/settings/cloudmessaging
 
registration_id = "<device registration_id>"
message_title = "Uber update"
message_body = "Hi john, your customized news for today is ready"
result = push_service.notify_single_device(registration_id=registration_id, message_title=message_title, message_body=message_body)
 
print result
 
# Send to multiple devices by passing a list of ids.
registration_ids = ["<device registration_id 1>", "<device registration_id 2>"]
message_title = "Uber update"
message_body = "Hope you're having fun this weekend, don't forget to check today's news"
result = push_service.notify_multiple_devices(registration_ids=registration_ids, message_title=message_title, message_body=message_body)
 
print result