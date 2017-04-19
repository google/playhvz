
## Web

### Running Web Server

To startup the server, run:

sudo npm install -g firebase-tools
cd web
firebase serve

### Installing a Polymer component

Run:

sudo npm install -g bower
cd web/
bower install paper-button


## Backend

pip install -r web/src/backend/requirements.txt -t web/src/backend/lib

dev_appserver.py web/src/backend/app.yaml

To launch a new version (once you have gcloud hooked in to the right app engine account):

gcloud app deploy web/src/backend/app.yaml


## Set up Firebase

This is for historical reasons only, you should never need to do this.

firebase init

(left database, functions, and hosting all checked, hit enter)

selected Zeds

let it use database.rules.json

let it install dependencies

for public directory, put client/

when it asks about single page app, say no

