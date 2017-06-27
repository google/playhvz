import path_utils

class Patch:
  """
  A Patch represents a set of changes that can comprise of deletes, puts,
  and smaller patches. They can be combined into a single batch mutation.

  Optionally, you can supply an additional target for all mutations.
  This additional target will be mutated when mutations are applied to the
  patch.
  """
  def __init__(self, additional=None):
    self.data_tree = {}
    self.path_tree = {}
    self.additional = additional

  def clear(self):
    self.data_tree.clear()
    self.path_tree.clear()

  def has_mutations(self):
    return self.data_tree or self.path_tree

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
    mutation_data_obj = path_utils.follow_path(self.data_tree, path, create_missing=True)
    if mutation_data_obj is not None and id in mutation_data_obj:
      del mutation_data_obj[id]
    mutation_paths_obj = path_utils.follow_path(self.path_tree, path, create_missing=True)
    if mutation_paths_obj is not None:
      mutation_paths_obj[id] = 'delete'
    if self.additional is None:
      return
    local_data_obj = path_utils.follow_path(self.additional, path)
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
    mutation_data_obj = path_utils.follow_path(self.data_tree, path, create_missing=True)
    if mutation_data_obj is not None:
      mutation_data_obj[id] = data
    mutation_paths_obj = path_utils.follow_path(self.path_tree, path, create_missing=True)
    if mutation_paths_obj is not None:
      mutation_paths_obj[id] = 'put'
    if self.additional is None:
      return
    local_data_obj = path_utils.follow_path(self.additional, path, create_missing=True)
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
    for key, value in data.iteritems():
      mutation_data_obj = path_utils.follow_path(self.data_tree, path_utils.join_paths(path, path_utils.drop_last(key)), create_missing=True)
      if mutation_data_obj is not None:
        mutation_data_obj[path_utils.last(key)] = value
      mutation_paths_obj = path_utils.follow_path(self.path_tree, path_utils.join_paths(path, path_utils.drop_last(key)), create_missing=True)
      if mutation_paths_obj is not None:
        mutation_paths_obj[path_utils.last(key)] = 'patch'
      if self.additional is None:
        continue
      local_data_obj = path_utils.follow_path(self.additional, path_utils.join_paths(path, path_utils.drop_last(key)), create_missing=True)
      if local_data_obj is not None:
        local_data_obj[path_utils.last(key)] = value


  def batch_mutation(self):
    batch_mutataion = {}
    all_paths = path_utils.crawl_paths(self.path_tree)
    for path in all_paths:
      leading_slash_path = '/' + path
      data_obj = path_utils.follow_path(self.data_tree, path_utils.drop_last(leading_slash_path))
      batch_mutataion[leading_slash_path] = data_obj.get(path_utils.last(leading_slash_path))
    return batch_mutataion
