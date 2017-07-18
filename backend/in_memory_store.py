#!/usr/bin/python
#
# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""TODO: High-level file comment."""

import sys
import copy


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
"""In memory model datastore"""

import db_helpers as helpers
import patch
import path_utils

from google.appengine.ext import deferred
from functools import partial
import threading

accessor_mutex = threading.Lock()
patch_mutex = threading.Lock()
enqueued_patch = patch.Patch()

def enqueue_patch(firebase, data):
  """
  Enqueue a patch to be sent to firebase. If a patch to firebase is ongoing,
  just leave the data in the patch queue and assume that once the ongoing patch
  completes, this data will be sent in the next patch.

  If no request is ongoing, acquire the lock to prevent accessors to firebase
  before it is up to date with all patches.
  """
  patch_mutex.acquire()
  enqueued_patch.patch('/', data)
  patch_mutex.release()
  print "getting accessor_mutex:", str(accessor_mutex)
  accessor_mutex.acquire()
  deferred.defer(compact_and_send, firebase=firebase, _queue="send-firebase-requests")
  accessor_mutex.release()

def compact_and_send(firebase):
  """
  Enqueue a patch to be sent to firebase. Compacts all queued patches into a
  single patch and sends it to firebase. Clears the patch queue
  """
  patch_mutex.acquire()
  compacted_batch_mutation = enqueued_patch.batch_mutation()
  enqueued_patch.clear()
  patch_mutex.release()
  print '****************** ACTUALLY SENDING COMPACTED BATCH MUTATION '
  print compacted_batch_mutation
  firebase.patch_async('/', compacted_batch_mutation, callback=partial(finished_patch, firebase))


def finished_patch(firebase, res):
  """
  Called when firebase completes. If there are outstanding patches left
  (incoming patches after a firebase request started but before it ended)
  Send the next patch. If not, clear the lock, allowing accessors to firebase.
  """
  if not enqueued_patch.has_mutations():
    accessor_mutex.acquire()
    print "releasing accessor_mutex:", str(accessor_mutex)
    accessor_mutex.release()
  else:
    print "continuing mutex"
    compact_and_send(firebase)


class InMemoryStore:
  """An in memory version of the data in firebase. Mutations applied to the
  store will also apply to the remote version of the data.
  Getting data from the store will return the same results as getting data
  from the remote firebase store.

  CAVEAT:
  Getting data during a transactional mutation (with several mutations)
  locally will return data as if the current mutations in the transaction have
  already been applied (because they have been). Getting data remotely will
  return data as if none of the current mutations have been applied.
  """
  def __init__(self):
    self.instance = None
    self.firebase = None
    self.transaction = None

  def maybe_load(self, firebase):
    """Load the firebase model from the remote source if a local copy
    doesn't exist.
    """
    if self.instance is None and self.firebase is None:
      print '*************** LOADING INSTANCE FROM FIREBASE *******************'
      self.instance = firebase.get('/', None) or {}
      self.firebase = firebase

  def strippedDatabaseContents(self, contents):
    contents = copy.deepcopy(contents)
    if 'chatRooms' in contents:
      for chat_room_id, chat_room in contents['chatRooms'].iteritems():
        if 'messages' in chat_room:
          del chat_room['messages']
    if 'privatePlayers' in contents:
      for private_player_id, private_player in contents['privatePlayers'].iteritems():
        if 'chatRoomMemberships' in private_player:
          for chat_room_id, chat_room_membership in private_player['chatRoomMemberships'].iteritems():
            if 'lastSeenTime' in chat_room_membership:
              del chat_room_membership['lastSeenTime']
            if 'lastHiddenTime' in chat_room_membership:
              del chat_room_membership['lastHiddenTime']
    return contents

  def databaseContentsEqual(self, contentsA, contentsB):
    contentsA = self.strippedDatabaseContents(contentsA)
    contentsB = self.strippedDatabaseContents(contentsB)
    return contentsA == contentsB

  def setToNewInstance(self, other_instance):
    old_instance = self.instance
    has_diff = not self.databaseContentsEqual(old_instance, other_instance)

    self.instance = other_instance
    # If there is a difference, firebase is out of sync.
    # Clear pending mutations
    #   (they are most likely operating on an inconsistent state)
    # Reinitialize the lock (because if the two states are different because
    #   a call failed, the callback won't be called and the lock won't be
    #   released.)
    if has_diff:
      enqueued_patch.clear()
      accessor_mutex = threading.Lock()
    return (has_diff, old_instance)

  def get(self, path, id, local_instance=True):
    """Get data from the model. Getting data from the local instance and the
    remove instance is the same with some exceptions:
    - Remote fetches don't have mutations from an unclosed transaction,
      local fetches do.

    Arguments:
      path: The path to get
      id: The id of the value to get at the path
      local_instance: If true, gets the data from the local copy,
          if false, gets the data from the remote copy.
    """
    if not local_instance:
      print "getting accessor_mutex"
      accessor_mutex.acquire()
      data = self.firebase.get(path, id)
      print "releasing accessor_mutex"
      accessor_mutex.release()
      return data
    full_path = path_utils.join_paths(path, id)
    obj = path_utils.follow_path(self.instance, path_utils.drop_last(full_path))
    if obj is None:
      return None
    return obj.get(path_utils.last(full_path))

  def delete(self, path, id):
    """add a deletion into the transaction"""
    self.transaction.delete(path, id)

  def put(self, path, id, data):
    """add a put into the transaction"""
    self.transaction.put(path, id, data)

  def patch(self, path, data):
    """Add a patch into the transaction"""
    self.transaction.patch(path, data)

  def start_transaction(self):
    """Open a transaction for this model."""
    self.transaction = Transaction(self)

  def commit_transaction(self):
    """"""
    self.transaction.commit()
    self.transaction = None


class Transaction:
  """A transaction is an atomic list of mutations that can be applied to the
  model. The mutation set is applied to the remote model only when the
  transaction is committed. All mutations are applied immediately to the
  local model.

  Mutations in a transaction is stored in two parallel trees:
    - a data tree that keeps the data to mutate
    - a path tree that keeps track of which paths are updated

  The path tree is crawled to create a list of absolute paths that must be
  modified in a single patch. This list of paths is guaranteed to not have a
  path that is a parent of another path in the list.

  This is needed because patching paths where one is a parent of another can
  yield an inconsistent state and firebase doesn't support deep patches.

  Example:
    put('a', 'b', {'c': {'d': foo'})
    mutation_data == {
      'a': {
        'b': {
          'c': {
            'd': 'foo'
          }
        }
      }
    }
    mutation_paths == {
      'a': {
        'b': 'put'
      }
    }

    put('a/b', 'e', 'bar')
    mutation_data == {
      'a': {
        'b': {
          'c': {
            'd': 'foo'
          }
          'e': 'bar'
        }
      }
    }
    mutation_paths == {
      'a': {
        'b': 'put'
      }
    }

    Generated batch mutation:
    {
      '/a/b': { 'c': { 'd': 'foo' }, 'e': 'bar' }
    }
  """
  def __init__(self, in_memory_store):
    self.firebase = in_memory_store.firebase
    self.local_patch = patch.Patch(in_memory_store.instance)
    self.has_mutation = False
    self.committed = False

  def delete(self, path, id):
    """Delete a value at a given path and id. If the path/id combo doesn't
    exist, nothing happens.

    Example:
      model = {'abc': { 'def': { 'hij': { 'hello': 'world' } } } }
      delete('abc/def', 'hij')
      model == {'abc': { 'def': { } }

    Arguments:
      path: The path to the location of the value
      id: The id of the value to delete
    """
    if self.committed:
      raise ServerError("Tried to apply mutation to closed transaction")
    self.has_mutation = True
    self.local_patch.delete(path, id)


  def put(self, path, id, data):
    """Put a value at a given path and id. If the path/id combo doesn't
    exist, the path is created.

    Example:
      model = {'abc': { } }
      put('abc/def', 'hij', {'hello': 'world'})
      model == {'abc': { 'def': { 'hij': { 'hello': 'world' } } } }

    Arguments:
      path: The path to the location of the value
      id: The key of the value to insert
      data: The value to insert
    """
    if self.committed:
      raise ServerError("Tried to apply mutation to closed transaction")
    self.has_mutation = True
    self.local_patch.put(path, id, data)


  def patch(self, path, data):
    """Patches a list of changes at a path. If the path/id combo doesn't
    exist, the path is created.

    Example:
      model = {'abc': { 'def': { 'foo': 'bar' } } }
      patch('abc/def', {'hij': {'hello': 'world'}, 'klm': 'mno'})
      model == {'abc':
        { 'def': { 'foo': 'bar', hij': { 'hello': 'world' }, 'klm': 'mno' } } }

    Arguments:
      path: The path at which to apply the patches
      data: The values to insert. A dict of ids(or sub paths) to values
    """
    if self.committed:
      raise ServerError("Tried to apply mutation to closed transaction")
    self.has_mutation = True
    self.local_patch.patch(path, data)


  def commit(self):
    """Applies all mutations in the transaction to the remote model.
    Must be called for every transaction opened. Deleting a transaction without
    calling commit will throw an error.

    We will crawl the path tree to find all the paths to include in the
    mutation. We then get the data in the data tree for each path.
    """
    if not self.has_mutation:
      self.committed = True
      return
    batch_mutation = self.local_patch.batch_mutation()
    print 'sending patch!'
    print batch_mutation
    enqueue_patch(self.firebase, batch_mutation)
    self.committed = True

  def __del__(self):
    """Require transactions to be committed before they are deleted."""
    if not self.committed:
      raise helpers.ServerError(
          "Transaction was deleted with uncommitted changes remaining.")
