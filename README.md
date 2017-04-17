sudo npm install -g firebase-tools


to startup the server, run:

cd web
firebase serve



if you want to install a component, run:

sudo npm install -g bower

then from client/, run for example:

bower install paper-button






to set up firebase, heres what i did:

firebase init

(left database, functions, and hosting all checked, hit enter)

selected Zeds

let it use database.rules.json

let it install dependencies

for public directory, put client/

when it asks about single page app, say no




from ghvz, you can start up a local version of the server with running the following two commands

pip install -r web/src/backend/requirements.txt -t web/src/backend/lib

dev_appserver.py web/src/backend/app.yaml

to launch a new version it is:

gcloud app deploy web/src/backend/app.yaml

once you have gcloud hooked in to the right app engine account

