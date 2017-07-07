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

This is not an official Google product.

# Humans vs Zombies
Full stack solution leveraging Firebase, Polymer, and a Python Flask server on App Engine to create a live action game. Learn more at https://humansvszombies.org/

## Contributing
Pull requests very welcome and encouraged, to help you get started we have broken it down to the level you want to test against. As mentioned in CONTRIBUTING.md, we do need you to submit a CLA first, but that should be an easy process.

## Local Development

You may run against the fake JS server (do nothing), run against production, or create your own Firebase project.

### Quick Start

Clone this project and follow the setup section if you are missing any dependencies

```bash
cd web
bower install
npm install
./node_modules/firebase-tools/bin/firebase login
./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4
```

Copy the first relevant part of web/config_.json to web/config.json (i.e., remove the underscore)

```
npm start
```

Visit [`localhost:5000`](localhost:5000)

Stop your webserver via Ctrl-C to abort

### Installing a Polymer component
Run `bower install paper-button` under web directory

### Running against prod
1. Copy the first relevant part of web/config_.json to web/config.json (i.e., remove the underscore)
1. Restart your web server
1. Go to [`localhost:5000/?bridge=remote`](localhost:5000/?bridge=remote)

### Your own Firebase project and backend
These are one time firebase setup instructions along with backend configuration

#### Front End (/web)
1. [Create a firebase project](https://console.firebase.google.com/?pli=1)
1. Open authentication using the left hand pane and enable (1) Google and (2) Email/Password
1. Open the users tab, create 8 users listed below

   Use the same password (**write it down**, you'll need it if you want to run webdrivers)
1. Hit the copy button next to zella's name and put that into your config.py and config.json

   Repeat for the remaining seven fake users.
1. In Firebase, open the web config and have these values ready to copy into the config.json file
1. In your project make a new web/config.json file, similar to the examples in web/config_.json and copy over the values
1. Run `./node_modules/firebase-tools/bin/firebase use --add ` ...your project...
1. Restart your development environment and visit [`localhost:5000/?bridge=remote`](localhost:5000/?bridge=remote)

|Fake Users|
|---|
|zella@playhvz.com|
|deckerd@playhvz.com|
|zeke@playhvz.com|
|moldavi@playhvz.com|
|jack@playhvz.com|
|minny@playhvz.com|
|reggie@playhvz.com|
|drake@playhvz.com|

#### Back End (/backend)
1. Open your Firebase account page and use the gear icon to select the settings
1. Make a copy of config\_.py and name it config.py (remove the underscore)
1. Back in Firebase copy your webconfig and place a copy into your newly created config.py
1. Click on the Service Accounts tab and navigate to the Database Secrets sub tab.
1. Show your the secrets key and copy it over for the FIREBASE_SECRET value in config.py.
1. You can now run your server with `dev_appserver.py app.yaml`
1. You can also navigate your front end to use this server with [localhost:5000/?bridge=remote](localhost:5000/?bridge=remote) as long as you setup your front end config's backend URL (config.json)

## Setup

### Front End
Install Node and NPM https://www.npmjs.com/get-npm

#### Mac - webdriver tests

Add this to your ~/.bash_profile: `export PATH=$PATH:[ghvz folder path here]/web/tests/macdrivers` for example: `export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/macdrivers`

`source ~/.bash_profile`

(continue in the common section below)

#### Linux - webdriver tests

Navigate to `web/tests/linuxdrivers`. Run `chmod +x chromedriver` to make the
chromedriver executable.

Note: If the default chromedriver does not work, you can download the latest
version [here](https://sites.google.com/a/chromium.org/chromedriver/downloads).

Add this to your ~/.bashrc: `export PATH=$PATH:[ghvz folder path here]/web/tests/linuxdrivers` for example: `export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/linuxdrivers`

(continue in the common section below)

#### Front End common

```bash
cd web/tests
pip install selenium
```

### Back End

#### Linux

```bash
sudo goobuntu-add-repo -e cloud-sdk-trusty
sudo apt-get update
sudo apt-get install google-cloud-sdk
sudo apt-get install google-cloud-sdk-app-engine-python
```

(continue in the common section below)

#### Mac

1. Go to https://cloud.google.com/appengine/downloads
1. Click Python
1. Click DOWNLOAD AND INSTALL THE CLOUD SDK
1. Download and install that SDK.

(continue in the common section below)

#### Back End Common

```bash
cd backend
gcloud init
```

Set project to humansvszombies-24348 (You should have access to this, but if you don't see this or don't have access to this, ask someone on the team)

`pip install -r requirements.txt -t lib`

Copy config_.py to config.py

If you're running your server against the prod firebase instance, replace FIREBASE_SECRET with
the key from https://console.firebase.google.com/project/trogdors-29fa4/settings/serviceaccounts/databasesecrets and replace the FIREBASE_CONFIG map with the map from clicking on "Web Setup" link at https://console.firebase.google.com/u/0/project/trogdors-29fa4/authentication

Start up the local server with `dev_appserver.py app.yaml`

## Testing

### Front End
Make sure you have webdriver setup by following instructions in the setup section above

First, start up your local server; the webdrivers assume something is running at localhost:5000

To run the webdrivers:

`cd web/tests`

`python run.py --password PASSWORD [--url TARGET_URL] [SPECIFIC_TEST_NAME] [-d|m] [-l|r]`

Replacing ALLCAPS'd segments with your values.
* `PASSWORD` is the password for your fake account. To get passwords for fake test accounts, please ask someone on the team.
* `SPECIFIC_TEST_NAME` maps to the test file name, minus the .py
* `-d` uses desktop window sizing. Omitting this flag will run with mobile sizing instead.
* `-m` uses mobile window sizing (default behavior).
* `-l` indicates local server testing, and will rely on in-memory state rather than a database.
* `-r` indicates remote server testing, and will use your firebase settings from `config.json`.

**Note**: Bracketed segments are optional.

### Back End

WARNING: This test will nuke our prod firebase. This is fine, everyone knows that that data could disappear at any moment. Though if two people run this test at the same time, it could fail. There's an open task on go/hvz-milestones (#201) to fix these particular inconveniences.

**First, get a local backend server running.** Then:
```bash
cd backend/
pip install requests
python backend_test.py
```

## Deploying to Prod

### Deploying back end

To launch a new version (once you have gcloud hooked in to the right app engine account):

`gcloud app deploy app.yaml`

#### Set up Firebase

* This is for historical reasons only, you should never need to do this.
* `firebase init`
* (left database, functions, and hosting all checked, hit enter)
* selected Zeds
* let it use database.rules.json
* let it install dependencies
* for public directory, put client/
* when it asks about single page app, say no

`./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4` (make sure you have the access to this project)

`./node_modules/firebase-tools/bin/firebase deploy`
