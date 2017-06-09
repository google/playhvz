"""In memory model datastore"""

import db_helpers as helpers

def follow_path(obj, path, create_missing=False):
  """Given a dict and a '/' separated path, follow that path and return the
  value at that location.

  Examples:
    obj={ a: { b: { c: { d: 'foo' } } } }
    path="/a/b"
    returns obj['a']['b']

  Arguments:
    obj: the object to look in
    path: the path to follow. Trailing '/' characters are ignored
    create_missing: If true, create any objects along the way needed to
        complete the traversal

  Returns: a reference to the value at the given path. If the path is
  '/' or '', obj is returned.
  """
  if path.endswith('/'):
    path = path[:-1]
  path_parts = path.split('/')[1:]
  for path_part in path_parts:
    if not path_part in obj:
      if create_missing and isinstance(obj, dict):
        obj[path_part] = {}
      else:
        return None
    obj = obj[path_part]
  return obj


def crawl_paths(obj):
  """Given a tree of strings, return the paths to every leaf.
  Doesn't include the actual leaf value.

  Example:
    crawl_paths({'a': {'b': 'foo', 'c': {'d' : 'foo'}}, 'e': 'bar'})
    => ['a/b', 'a/c/d', 'e']
  """
  all_paths = []
  if isinstance(obj, basestring):
    return all_paths
  for key, value in obj.iteritems():
    sub_paths = crawl_paths(value)
    for sub_path in sub_paths:
      all_paths.append(key + '/' + sub_path)
    if len(sub_paths) is 0:
      all_paths.append(key)
  return all_paths


def join_paths(path, suffix):
  """Joins a path and a suffix into a single path.
  Resolves leading and trailing '/'. The suffix can be null.

  Examples:
    join_paths('abc/def/', '/hij') => 'abc/def/hij'
    join_paths('a', 'b/c/d') => 'a/b/c/d'
    join_paths('abc/def', None) => 'abc/def'
  """
  if not path.endswith('/'):
    path = path + '/'
  if suffix is None:
    suffix = ''
  if suffix.startswith('/'):
    suffix = suffix[1:]
  full_path = '%s%s' % (path, suffix)
  if full_path[-1] == '/':
    full_path = full_path[:-1]
  return full_path


def drop_last(path):
  """Returns a path with the last "part" dropped.

  Examples:
    drop_last('abc/def/ghi') => 'abc/def'
    drop_last('abc') => ''
    drop_last('') => ''
  """
  if '/' not in path:
    return ''
  return '/'.join(path.split('/')[:-1])

def last(path):
  """Returns a last "part" of a path.

  Examples:
    last('abc/def/ghi') => 'ghi'
    last('abc') => 'abc'
    last('') => ''
  """
  if '/' not in path:
    return path
  return path.split('/')[-1]

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
      return self.firebase.get(path, id)
    full_path = join_paths(path, id)
    obj = follow_path(self.instance, drop_last(full_path))
    if obj is None:
      return None
    return obj.get(last(full_path))

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
    self.transaction = Transaction(self.firebase, self.instance)

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
  def __init__(self, firebase, instance):
    self.instance = instance
    self.firebase = firebase
    self.mutation_data = {}
    self.mutation_paths = {}
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
    mutation_data_obj = follow_path(self.mutation_data, path, create_missing=True)
    if mutation_data_obj is not None and id in mutation_data_obj:
      del mutation_data_obj[id]
    mutation_paths_obj = follow_path(self.mutation_paths, path, create_missing=True)
    if mutation_paths_obj is not None:
      mutation_paths_obj[id] = 'delete'
    local_data_obj = follow_path(self.instance, path)
    if local_data_obj is not None and id in local_data_obj:
      del local_data_obj[id]


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
    mutation_data_obj = follow_path(self.mutation_data, path, create_missing=True)
    if mutation_data_obj is not None:
      mutation_data_obj[id] = data
    mutation_paths_obj = follow_path(self.mutation_paths, path, create_missing=True)
    if mutation_paths_obj is not None:
      mutation_paths_obj[id] = 'put'
    local_data_obj = follow_path(self.instance, path, create_missing=True)
    if local_data_obj is not None:
      local_data_obj[id] = data


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
    for key, value in data.iteritems():
      mutation_data_obj = follow_path(self.mutation_data, join_paths(path, drop_last(key)), create_missing=True)
      if mutation_data_obj is not None:
        mutation_data_obj[last(key)] = value
      mutation_paths_obj = follow_path(self.mutation_paths, join_paths(path, drop_last(key)), create_missing=True)
      if mutation_paths_obj is not None:
        mutation_paths_obj[last(key)] = 'patch'
      local_data_obj = follow_path(self.instance, join_paths(path, drop_last(key)), create_missing=True)
      if local_data_obj is not None:
        local_data_obj[last(key)] = value


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
    batch_mutation = {}
    all_paths = crawl_paths(self.mutation_paths)
    for path in all_paths:
      leading_slash_path = '/' + path
      value = follow_path(self.mutation_data, leading_slash_path)
      batch_mutation[leading_slash_path] = value
    print 'sending patch!'
    print batch_mutation
    self.firebase.patch('/', batch_mutation)
    self.committed = True

  def __del__(self):
    """Require transactions to be committed before they are deleted."""
    if not self.committed:
      raise helpers.ServerError(
          "Transaction was deleted with uncommitted changes remaining.")
