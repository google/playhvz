# [START app]
import logging

from firebase import firebase
from flask import Flask, jsonify, request
import flask_cors
from google.appengine.ext import ndb
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine

import constants

requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()

app = Flask(__name__)
auth = firebase.FirebaseAuthentication(constants.FIREBASE_SECRET,
                                       constants.FIREBASE_EMAIL, admin=True)
firebase = firebase.FirebaseApplication('https://trogdors-29fa4.firebaseio.com', authentication=auth)
flask_cors.CORS(app)

class AppError(Exception):
    status_code = 500
    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.route('/')
def index():
  return "<h1>Welcome To Google HVZ (backend)!</h1>"


@app.route('/test', methods=['GET'])
def get_testdata():
  testdata = firebase.get('testdata', None)
  return jsonify(testdata)

@app.route('/register', methods=['POST'])
def register():
  try:
    data = request.get_json()
    userId = data['userToken']
    userdata = {
        'registered': True
    }
    firebase.put('/users', userId, userdata)
    return ''
  except:
    return AppError("There was an app error")

@app.route('/creategame', methods=['POST'])
def new_game():
  data = request.get_json()
  gameId = data['gameId']
  adminUserId = data['adminUserId']
  name = request.args.get('name', '')
  rulesUrl = request.args.get('rulesUrl', '')
  stunTimer = request.args.get('stunTimer', '')

  gamedata = {
    'name': name,
    'rulesUrl': rulesUrl,
    'stunTimer': stunTimer,
    'active': True
  }
  firebase.put('/games', gameId, gamedata)
  return ''
