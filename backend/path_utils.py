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


def main(argv):
    pass


if __name__ == '__main__':
    main(sys.argv)
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
    if not isinstance(obj, dict):
      return None
  return obj


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
