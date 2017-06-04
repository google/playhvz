
## Web

### Running Web Server

To startup the server, run:

`cd web`

`npm install` 

`./node_modules/firebase-tools/bin/firebase login [your username]`

`./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4` (make sure you have the access to this project)

`npm start`

### Installing a Polymer component

Run:

`bower install paper-button` under web directory


## Backend
$ sudo goobuntu-add-repo -e cloud-sdk-trusty
$ sudo apt-get update
$ sudo apt-get install google-cloud-sdk
$ sudo apt-get install google-cloud-sdk-app-engine-python

$ gcloud init
Set project to humansvszombies-24348 (All of our collaborators should have access to this)

$ pip install -r backend/requirements.txt -t backend/lib

$ dev_appserver.py backend/app.yaml

To launch a new version (once you have gcloud hooked in to the right app engine account):

$ gcloud app deploy backend/app.yaml


## Set up Firebase

This is for historical reasons only, you should never need to do this.

firebase init

(left database, functions, and hosting all checked, hit enter)

selected Zeds

let it use database.rules.json

let it install dependencies

for public directory, put client/

when it asks about single page app, say no


## Webdriver Tests

### Setup (Mac)

Add this to your ~/.bash_profile:

export PATH=$PATH:[ghvz folder path here]/web/tests/macdrivers

For example:

export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/macdrivers

### Setup (Linux)

(this doesnt work yet because nobody's checked in linuxdrivers, talk to chewys or verdagon if you want to run on linux)

Add this to your ~/.bashrc:

export PATH=$PATH:[ghvz folder path here]/web/tests/linuxdrivers

For example:

export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/linuxdrivers

### Running

To run the webdrivers:

cd web/src/tests

./run.sh
