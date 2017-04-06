sudo npm install -g firebase-tools


to startup the server, in the root directory run:

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

