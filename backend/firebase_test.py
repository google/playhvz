import logging
import time
import random

from firebase import firebase

HTTP_REQUEST = google.auth.transport.requests.Request()

# TODO(chewys): Figure out how to make this log in with an email and password
auth = firebase.FirebaseAuthentication(
    config.FIREBASE_SECRET, config.FIREBASE_EMAIL, admin=True)
db = firebase.FirebaseApplication(
    config.FIREBASE_CONFIG['databaseURL'], authentication=auth)
