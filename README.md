
## Web

### Running Web Server

`cd web`

`npm install`

`./node_modules/firebase-tools/bin/firebase login [your username]`

`./node_modules/firebase-tools/bin/firebase use --add` and select the firebase project you want to use. trogdors-29fa4 is our prod project.

`npm start`

Go to `localhost:5000`

This will run against the in-memory fake JS server.

#### Running against the in-memory fake JS server:

Go to `localhost:5000`

(yes, the default is the in-memory fake JS server)

#### Running against the prod server and prod firebase

`cd web`

See the config in web/config_.json and put it in a new web/config.json file (note the lack of an underscore there).

`npm start`

Go to `localhost:5000/?bridge=remote`

#### Running against a local backend and prod firebase

`cd web`

`./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4` (make sure you have the access to this project)

See the config in web/config_.json and put it in a new web/config.json file (note the lack of an underscore there).

`npm start`

Go to `localhost:5000/?bridge=remote`

#### Running against your own firebase, local client, and local backend

See the similarly named section at the end.

#### Deploying to Prod

`./node_modules/firebase-tools/bin/firebase use --add trogdors-29fa4` (make sure you have the access to this project)

`./node_modules/firebase-tools/bin/firebase deploy`

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

Copy backend/config_.py to backend/config.py

If you're running your server against the prod firebase instance, replace FIREBASE_SECRET with
the key from https://console.firebase.google.com/project/trogdors-29fa4/settings/serviceaccounts/databasesecrets and replace the FIREBASE_CONFIG map with the map from clicking on "Add Firebase to your web app" at https://console.firebase.google.com/project/trogdors-29fa4/settings/serviceaccounts/databasesecrets

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


### Running against your own firebase, and local backend

See the similarly named section at the end.


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

`./run.sh http://localhost:5000 fake PASSWORDHERE` replacing PASSWORDHERE with the fake accounts' password (ask someone on the team).



## Setting up your own firebase, local client, and local backend

Go to http://firebase.com/

Click Get Started

Add a project, give it a name, hit Create Project.

In the project overview page, click "Add Firebase to your web app"

Use these values to fill in config\_.py. Keep reading to find out what FIREBASE_SECRET should be.

In the Firebase project overview page, hit the gear icon, and hit Project Settings.

Click on the Service Accounts tab.

Click on the Database Secrets tab.

In the Secrets section, hover over the secrets key and hit Show.

Use that value for the FIREBASE_SECRET value in config\_.py.

Click on the Authentication tab, and click on the Sign In Method tab. Enable Google and Email/Password.

Click the Users tab.

Make eight users: zella@playhvz.com, deckerd@playhvz.com, zeke@playhvz.com, moldavi@playhvz.com, jack@playhvz.com, minny@playhvz.com, reggie@playhvz.com, drake@playhvz.com, all using the same password (write down the password, youll need it if you want to run webdrivers).

Hit the copy button next to zella's name and put that into your config.py and config.json. Repeat
for the remaining seven fake users.

You can now run your server with `dev_appserver.py backend/app.yaml`

### Setting up your local web server to talk to your own firebase and local backend

Make a new web/config.json file, similar to the examples in web/config_.json.

Fill in the values from when you set up your local backend to talk to your firebase.

`cd web`

Run your web server with `npm start`

Go to `localhost:5000/?bridge=remote`
