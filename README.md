# Humans vs Zombies
Full stack solution leveraging firebase, polymer, and app engine (NodeJS) to create a live action game. Learn more at https://humansvszombies.org/

## Contributing
Pull requests very welcome and encouraged, to help you get started we have broken it down to the level you want to test against.

## Local Development

You may run against the fake JS server (do nothing), run against production, or create your own Firebase project.

### Quick Start

Clone this project and follow the setup section if you are missing any dependencies 

```bash
cd web
npm install
./node_modules/firebase-tools/bin/firebase login
./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4
npm start
```
Visit [`localhost:5000`](localhost:5000)

Stop your webserver via Ctrl-C to abort


### Installing a Polymer component
Run `bower install paper-button` under web directory

### Running against prod
1. `cp web/config_.json web/config.json` (i.e., remove the underscore)
1. Restart your web server
1. Go to [`localhost:5000/?bridge=remote`](localhost:5000/?bridge=remote)

### Your own Firebase project
This is a one time firebase setup

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
1. Click on the Service Accounts tab and navigate to the Database Secrets sub tab.
1. Show your the secrets key and copy it over for the FIREBASE_SECRET value in config\_.py.
1. You can now run your server with `dev_appserver.py app.yaml`


## Setup

### Front End
Install Node and NPM https://www.npmjs.com/get-npm

#### Mac - webdriver tests

Add this to your ~/.bash_profile: `export PATH=$PATH:[ghvz folder path here]/web/tests/macdrivers` for example: `export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/macdrivers`

`source ~/.bash_profile`

(continue in the common section below)

#### Linux - webdriver tests

(this doesnt work yet because nobody's checked in linuxdrivers, talk to chewys or verdagon if you want to run on linux)

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

`./run.sh http://localhost:5000 fake PASSWORDHERE` replacing PASSWORDHERE with the fake accounts' password (ask someone on the team).


### Back End

WARNING: This test will nuke our prod firebase. This is fine, everyone knows that that data could disappear at any moment. Though if two people run this test at the same time, it could fail. There's an open task on go/hvz-milestones (#201) to fix these particular inconveniences.

First, get a local backend server running. Then:
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
