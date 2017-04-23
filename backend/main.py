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
    request_data = request.get_json()
    userId = request_data['userToken']
    put_data = {
        'registered': True
    }
    firebase.put('/users', userId, put_data)
    return ''
  except:
    return AppError("There was an app error")


@app.route('/creategame', methods=['POST'])
def new_game():
  request_data = request.get_json()
  game = request_data['gameId']
  adminUser = request_data['adminUserId']
  name = request_data.get('name', '')
  rulesUrl = request_data.get('rulesUrl', '')
  stunTimer = request_data.get('stunTimer', '')

  put_data = {
    'name': name,
    'rulesUrl': rulesUrl,
    'stunTimer': stunTimer,
    'active': True
  }
  return jsonify(firebase.put('/games', game, put_data))


@app.route('/addGun', methods=['POST'])
def add_gun():
  request_data = request.get_json()
  gun = request_data['gunId']

  put_data = {
    'playerId': '',
  }
  return jsonify(firebase.put('/guns', gun, put_data))


@app.route('/gun', methods=['GET'])
def get_gun():
  gun = request.args['gunId']
  return jsonify(firebase.get('/guns', gun))


@app.route('/assignGun', methods=['POST'])
def assign_gun():
  request_data = request.get_json()

  args = ['gameId', 'playerId', 'gunId']
  if any(a not in request_data for a in args):
    return AppError('Missing data. assignGun requires: %s' % ', '.join(args))

  game = request_data['gameId']
  gun = request_data['gunId']
  player = request_data['playerId']

  if not firebase.get('/games/%s/name' % game, None):
    return AppError('Game %s not found.' % game)
  if not firebase.get('/games/%s/players/%s/name' % (game, player), None):
    return AppError('Player %s not found.' % player)
  if not firebase.get('/guns', gun):
    return AppError('Gun %s not found.' % gun)

  put_data = {
    'playerId': player,
    'gameId': game,
  }
  return jsonify(firebase.put('/guns', gun, put_data))


@app.route('/updatePlayer', methods=['POST'])
def update_player():
  request_data = request.get_json()
  player = request_data['playerId']
  game = request_data['gameId']

  put_data = {}
  for property in ['name', 'needGun', 'profileImageUrl', 'startAsZombie', 'volunteer']:
    if property in request_data:
      put_data[property] = request_data[property]

  path = '/games/%s/players/%s' % (game, player)
  print '%s => %s' % (path, repr(put_data))
  return jsonify(firebase.patch(path, put_data, {'print': 'pretty'}))


@app.route('/addMission', methods=['POST'])
def add_mission():
  request_data = request.get_json()
  game = request_data['gameId']
  mission = request_data['missionId']

  put_data = {
    'name': request_data['name'],
    'begin': request_data['begin'],
    'end': request_data['end'],
    'url': request_data['url'],
    'allegiance': request_data['allegiance'],
  }

  path = '/games/%s/missions' % game
  return jsonify(firebase.put(path, mission, put_data))


@app.route('/updateMission', methods=['POST'])
def update_mission():
  request_data = request.get_json()
  game = request_data['gameId']
  mission = request_data['missionId']

  put_data = {}
  for property in ['name', 'begin', 'end', 'url', 'allegiance']:
    if property in request_data:
      put_data[property] = request_data[property]

  path = '/games/%s/missions/%s' % (game, mission)
  return jsonify(firebase.patch(path, put_data))
