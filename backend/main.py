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
