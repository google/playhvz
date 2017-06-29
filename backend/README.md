Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
# Deploying the backend
Run `bash deploy` from the `backend` directory. This creates a secrets file in
a config directory and uses that file for deploying.

The first time you run this, it will prompt you for the Firebase secret and for
three Ionic secrets. If you mess them up, you can fix them inside either
`~/.xdk/config/hvz_secrets` or `~/.config/hvz_secrets`.

## File layout:

* `app.yaml`: Backend GCE config
* `cron.yaml`: cron GCE config
* `main.py`: Backend handling of requests and mapping of endpoints to api_calls
* `main_test.py`: Test for the above Flask-based file
* `appengine_config.py`: App Engine configs

* `api_calls.py`: Bulk of the end point code; handles end point calls
* `api_calls_test.py`: Unit tests for the above
* `backend_test.py`: End to end testing of the backend and Firebase
* `backend_test_data.json`: JSON to match against Firebase at the end of an e2e test
* `constants.py`: A small collection of constant values
* `db_helpers.py`: Helper methods for accessing data in Firebase
* `deploy`: Shell script to use to deploy the backend
* `notifications.py`: Code used to handle (cron-based) scheduling and sending notifications
* `requirements.txt`: GCE - required Python libs
* `secrets.py`: Auto-generated via the `deploy` script. DO NOT COMMIT TO GIT.
* `secrets_.py`: Template which explains how `secrets.py` should look
* `setup_secrets.bash`: Helper script used to generate the `secrets.py` file
* `wordlist.txt`: A list of English words used to generate human-codes.
