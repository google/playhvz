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


methods = {
  'register': api_calls.Register,
  'createGame': api_calls.CreateGame,
  'updateGame': api_calls.UpdateGame,
  'createPlayer': api_calls.CreatePlayer,
  'addGun': api_calls.AddGun,
  'assignGun': api_calls.AssignGun,
  'updatePlayer': api_calls.UpdatePlayer,
  'addMission': api_calls.AddMission,
  'updateMission': api_calls.UpdateMission,
  'createChatRoom': api_calls.CreateChatRoom,
  'addPlayerToChat': api_calls.AddPlayerToChat,
  'sendChatMessage': api_calls.SendChatMessage,
  'addRewardCategory': api_calls.AddRewardCategory,
  'updateRewardCategory': api_calls.UpdateRewardCategory,
  'addReward': api_calls.AddReward,
  'claimReward': api_calls.ClaimReward,
}


@app.route('/')
def index():
  return "<h1>Welcome To Google HVZ (backend)!</h1>"


@app.route('/help')
def ApiHelp():
  r = ['%s: %s' % (k, v.__doc__) for k, v in methods.iteritems()]
  return '\n---\n\n'.join(r)


@app.route('/test', methods=['GET'])
def get_testdata():
  testdata = GetFirebase().get('testdata', None)
  return jsonify(testdata)


@app.route('/gun', methods=['GET'])
def GetGun():
  gun = request.args['gunId']
  return jsonify(GetFirebase().get('/guns', gun))


@app.route('/api/<method>', methods=['POST'])
def RouteRequest(method):
  if method not in methods:
    raise AppError('Invalid method %s' % method)
  f = methods[method]

  return jsonify(f(request.get_json(), GetFirebase()))

# vim:ts=2:sw=2:expandtab
