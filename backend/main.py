# [START app]
import logging

from firebase import firebase
from flask import Flask, jsonify, request, g
from google.appengine.ext import ndb
import flask_cors
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine

import api_calls
import constants


requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()


app = Flask(__name__)
flask_cors.CORS(app)


def GetFirebase():
  """Get a Firebase connection, cached in the application context."""
  db = getattr(g, '_database', None)
  if db is None:
    auth = firebase.FirebaseAuthentication(
				constants.FIREBASE_SECRET, constants.FIREBASE_EMAIL, admin=True)
    db = firebase.FirebaseApplication(
				'https://trogdors-29fa4.firebaseio.com', authentication=auth)
    g._database = db
  return db


class AppError(Exception):
  """Generic error class for app errors."""
  status_code = 500
  def __init__(self, message, status_code=None, payload=None):
    Exception.__init__(self)
    self.message = message
    if status_code is None:
      self.status_code = status_code
    if payload is None:
      self.payload = payload

  def to_dict(self):
    rv = dict(self.payload or ())
    rv['message'] = self.message
    return rv


@app.errorhandler(api_calls.InvalidInputError)
def HandleError(e):
  """Pretty print data validation errors."""
  return 'The request is not valid. %s' % e.message, 500


@app.errorhandler(500)
def HandleError(e):
  """Pretty print data validation errors."""
  return '500: %r %r' % (type(e), e), 500


@app.route('/')
def index():
  return "<h1>Welcome To Google HVZ (backend)!</h1>"


@app.route('/test', methods=['GET'])
def get_testdata():
  testdata = GetFirebase().get('testdata', None)
  return jsonify(testdata)


@app.route('/gun', methods=['GET'])
def GetGun():
  gun = request.args['gunId']
  return jsonify(GetFirebase().get('/guns', gun))


@app.route('/register', methods=['POST'])
def Register():
  return jsonify(api_calls.Register(request.get_json(), GetFirebase()))


@app.route('/createGame', methods=['POST'])
def CreateGame():
  return jsonify(api_calls.CreateGame(request.get_json(), GetFirebase()))


@app.route('/createPlayer', methods=['POST'])
def CreatePlayer():
  return jsonify(api_calls.CreatePlayer(request.get_json(), GetFirebase()))


@app.route('/addGun', methods=['POST'])
def AddGun():
  return jsonify(api_calls.AddGun(request.get_json(), GetFirebase()))


@app.route('/assignGun', methods=['POST'])
def AssignGun():
  return jsonify(api_calls.AssignGun(request.get_json(), GetFirebase()))


@app.route('/updatePlayer', methods=['POST'])
def UpdatePlayer():
  return jsonify(api_calls.UpdatePlayer(request.get_json(), GetFirebase()))


@app.route('/addMission', methods=['POST'])
def AddMission():
  return jsonify(api_calls.AddMission(request.get_json(), GetFirebase()))


@app.route('/updateMission', methods=['POST'])
def UpdateMission():
  return jsonify(api_calls.UpdateMission(request.get_json(), GetFirebase()))


@app.route('/createChatRoom', methods=['POST'])
def CreateChatRoom():
  return jsonify(api_calls.CreateChatRoom(request.get_json(), GetFirebase()))


@app.route('/addPlayerToChat', methods=['POST'])
def AddPlayerToChat():
  return jsonify(api_calls.AddPlayerToChat(request.get_json(), GetFirebase()))


@app.route('/sendChatMessage', methods=['POST'])
def SendChatMessage():
  return jsonify(api_calls.SendChatMessage(request.get_json(), GetFirebase()))


@app.route('/addRewardCategory', methods=['POST'])
def AddRewardCategory():
  return jsonify(api_calls.AddRewardCategory(request.get_json(), GetFirebase()))


@app.route('/updateRewardCategory', methods=['POST'])
def UpdateRewardCategory():
  return jsonify(api_calls.UpdateRewardCategory(request.get_json(), GetFirebase()))


@app.route('/addReward', methods=['POST'])
def AddReward():
  return jsonify(api_calls.AddReward(request.get_json(), GetFirebase()))


@app.route('/claimReward', methods=['POST'])
def ClaimReward():
  return jsonify(api_calls.ClaimReward(request.get_json(), GetFirebase()))


# vim:ts=2:sw=2:expandtab
