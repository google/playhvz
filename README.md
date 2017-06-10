
## Web

### Running Web Server

To startup the server, run:

`cd web`

`npm install` 

`./node_modules/firebase-tools/bin/firebase login [your username]`

`./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4` (make sure you have the access to this project)

`npm start`

Go to `localhost:5000`

This will run against the in-memory fake JS server.

#### Running against the prod server and prod firebase

Go to `localhost:5000/?env=prod`

#### Running against a local server and prod firebase

Go to `localhost:5000/?env=localprod`

#### Running against the in-memory fake JS server:

Go to `localhost:5000`

(yes, the default is the in-memory fake JS server)

#### Installing a Polymer component

Run `bower install paper-button` under web directory


## Backend

`sudo goobuntu-add-repo -e cloud-sdk-trusty`

`sudo apt-get update`

`sudo apt-get install google-cloud-sdk`

`sudo apt-get install google-cloud-sdk-app-engine-python`

`gcloud init`

Set project to humansvszombies-24348 (All of our collaborators should have access to this)

`pip install -r backend/requirements.txt -t backend/lib`

Copy backend/secrets_.py to backend/secrets.py

Follow the instructions in backend/secrets.py regarding the firebase secret.

Start up the local server with `dev_appserver.py backend/app.yaml`

### Deploying to Prod

To launch a new version (once you have gcloud hooked in to the right app engine account):

`gcloud app deploy backend/app.yaml`

### Running Backend Tests

WARNING: This test will nuke our prod firebase. This is fine, everyone knows that that data could disappear at any moment. Though if two people run this test at the same time, it could fail. There's an open task on go/hvz-milestones (#201) to fix these particular inconveniences.

First, get a local backend server running.

`pip install requests`

`cd backend/`

`python backend_test.py`


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

Add this to your ~/.bash_profile: `export PATH=$PATH:[ghvz folder path here]/web/tests/macdrivers` for example: `export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/macdrivers`

`source ~/.bash_profile`

`cd web/tests`

`pip install selenium`

### Setup (Linux)

(this doesnt work yet because nobody's checked in linuxdrivers, talk to chewys or verdagon if you want to run on linux)

Add this to your ~/.bashrc: `export PATH=$PATH:[ghvz folder path here]/web/tests/linuxdrivers` for example: `export PATH=$PATH:/Users/verdagon/Desktop/ghvz/web/tests/linuxdrivers`

`cd web/tests`

`pip install selenium`

### Running

First, start up your local server; the webdrivers assume something is running at localhost:5000

To run the webdrivers:

`cd web/tests`

`./run.sh`
