# [START app]
import logging

from firebase import firebase
from flask import Flask, jsonify, request
import flask_cors
from google.appengine.ext import ndb
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine

requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()

# Fill out with value from https://firebase.corp.google.com/project/trogdors-29fa4/settings/database
FIREBASE_SECRET = ""
FIREBASE_EMAIL = ""

app = Flask(__name__)
auth = firebase.FirebaseAuthentication(FIREBASE_SECRET, FIREBASE_EMAIL, admin=True)
firebase = firebase.FirebaseApplication('https://trogdors-29fa4.firebaseio.com', authentication=auth)
flask_cors.CORS(app)

@app.route('/')
def index():
  return "<h1>Welcome To Google HVZ (backend)!</h1>"


@app.route('/test', methods=['GET'])
def get_testdata():

  testdata = firebase.get('testdata', None)

  return jsonify(testdata)

@app.route('/creategame', methods=['POST'])
def new_game():
  data = request.get_json()
  gameId = data['gameId']
  adminUserId = data['adminUserId']
  args = dict(request.args)
  if 'name' in args:
    name = args['name'][0]
  else:
    name = ''

  if 'rulesUrl' in args:
    rulesUrl = args['rulesUrl'][0]
  else:
    rulesUrl = ''

  if 'stunTimer' in args:
    stunTimer = args['stunTimer'][0]
  else:
    stunTimer = ''

  gamedata = {'name': name, 'rulesUrl': rulesUrl, 'stunTimer': stunTimer, 'active': True}

  firebase.put('/games', gameId, gamedata)
  return ''
