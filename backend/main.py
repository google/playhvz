# [START app]
import logging
import time
import random

from firebase import firebase
from flask import Flask, jsonify, request, g
from google.appengine.ext import ndb
import flask_cors
import google.auth.transport.requests
import google.oauth2.id_token
import requests_toolbelt.adapters.appengine
import json
import threading

import api_calls
import constants
import in_memory_store as store
import notifications
import config

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

requests_toolbelt.adapters.appengine.monkeypatch()
HTTP_REQUEST = google.auth.transport.requests.Request()

app = Flask(__name__)
flask_cors.CORS(app)
game_state = store.InMemoryStore()
api_mutex = threading.Lock()

def GetFirebase():
  """Get a Firebase connection, cached in the application context."""
  db = getattr(g, '_database', None)
  if db is None:
    auth = firebase.FirebaseAuthentication(
        config.FIREBASE_SECRET, config.FIREBASE_EMAIL, admin=True)
    db = firebase.FirebaseApplication(
        config.FIREBASE_CONFIG['databaseURL'], authentication=auth)
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

@app.errorhandler(AppError)
def HandleError(e):
  """Pretty print data validation errors."""
  return 'Something went wrong. %s' % e.message, 500


@app.errorhandler(500)
def HandleError(e):
  """Pretty print data validation errors."""
  logging.exception(e)
  return '500: %r %r' % (type(e), e), 500


methods = {
  'register': api_calls.Register,
  'createGame': api_calls.AddGame,
  'updateGame': api_calls.UpdateGame,
  'addAdmin': api_calls.AddGameAdmin,
  'createGroup': api_calls.AddGroup,
  'updateGroup': api_calls.UpdateGroup,
  'addPlayerToGroup': api_calls.AddPlayerToGroup,
  'removePlayerFromGroup': api_calls.RemovePlayerFromGroup,
  'createPlayer': api_calls.AddPlayer,
  'addGun': api_calls.AddGun,
  'assignGun': api_calls.AssignGun,
  'updatePlayer': api_calls.UpdatePlayer,
  'addMission': api_calls.AddMission,
  'deleteMission': api_calls.DeleteMission,
  'updateMission': api_calls.UpdateMission,
  'createChatRoom': api_calls.AddChatRoom,
  'updateChatRoom': api_calls.UpdateChatRoom,
  'sendChatMessage': api_calls.SendChatMessage,
  'ackChatMessage': api_calls.AckChatMessage,
  'addRewardCategory': api_calls.AddRewardCategory,
  'updateRewardCategory': api_calls.UpdateRewardCategory,
  'addReward': api_calls.AddReward,
  'addRewards': api_calls.AddRewards,
  'claimReward': api_calls.ClaimReward,
  'sendNotification': api_calls.SendNotification,
  'registerUserDevice': api_calls.RegisterUserDevice,
  'updateNotification': api_calls.UpdateNotification,
  'markNotificationSeen': api_calls.MarkNotificationSeen,
  'addLife': api_calls.AddLife,
  'infect': api_calls.Infect,
  'joinResistance': api_calls.JoinResistance,
  'joinHorde': api_calls.JoinHorde,
  'setAdminContact': api_calls.SetAdminContact,
  'updateRequestCategory': api_calls.UpdateRequestCategory,
  'addRequestCategory': api_calls.AddRequestCategory,
  'addRequest': api_calls.AddRequest,
  'addResponse': api_calls.AddResponse,
  'addQuizQuestion': api_calls.AddQuizQuestion,
  'addQuizAnswer': api_calls.AddQuizAnswer,
  'addDefaultProfileImage': api_calls.AddDefaultProfileImage,
  'createMap': api_calls.AddMap,
  'addPoint': api_calls.AddPoint,
  'DeleteTestData': api_calls.DeleteTestData,
  'DumpTestData': api_calls.DumpTestData,
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


@app.route('/cronNotification', methods=['GET'])
def CronNotification():
  cron_key = 'X-Appengine-Cron'
  if cron_key not in request.headers or not request.headers[cron_key]:
    return 'Unauthorized', 403
  notifications.ExecuteNotifications(None, GetFirebase())
  return 'OK'

@app.route('/stressTest', methods=['POST'])
def StressTest():
  begin_time = time.time()

  for i in range(0, 50):
    HandleSingleRequest('register', {
      'requestingUserId': None,
      'requestingUserToken': 'blark',
      'requestingPlayerId': None,
      'userId': 'user-wat-%d' % random.randint(0, 2**52),
    })

  end_time = time.time()
  print "Did 50 requests in %f seconds" % (end_time - begin_time)
  return ''

@app.route('/stressTestBatch', methods=['POST'])
def StressTestBatch():
  begin_time = time.time()

  requests = []
  for i in range(0, 50):
    requests.append({
      'method': 'register',
      'body': {
        'requestingUserId': None,
        'requestingUserToken': 'blark',
        'requestingPlayerId': None,
        'userId': 'user-wat-%d' % random.randint(0, 2**52),
      }
    })
  HandleBatchRequest(requests)

  end_time = time.time()
  print "Did 50 requests in %f seconds" % (end_time - begin_time)
  return ''

@app.route('/api/<method>', methods=['POST'])
def SingleEndpoint(method):
  return jsonify(HandleSingleRequest(method, json.loads(request.data)))

@app.route('/api/batch', methods=['POST'])
def BatchEndpoint():
  return jsonify(HandleBatchRequest(json.loads(request.data)))

def HandleSingleRequest(method, body):
  result = HandleBatchRequest([{'method': method, 'body': body}])
  return result[0]

def HandleBatchRequest(requests):
  game_state.maybe_load(GetFirebase())
  results = []
  try:
    api_mutex.acquire()
    game_state.start_transaction()

    for i, request in enumerate(requests):
      method = request['method']
      body = request['body']
      print "Handling request %d: %s" % (i, method)
      results.append(CallApiMethod(method, body))
  finally:
    game_state.commit_transaction()
    api_mutex.release()
  return results

def CallApiMethod(method, request_body):
  if method not in methods:
    raise AppError("Invalid method %s" % method)
  f = methods[method]
  return f(request_body, game_state)

# vim:ts=2:sw=2:expandtab
