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
# The default ``config.py``
# flake8: noqa


def set_prefs(prefs):
    """This function is called before opening the project"""

    # Specify which files and folders to ignore in the project.
    # Changes to ignored resources are not added to the history and
    # VCSs.  Also they are not returned in `Project.get_files()`.
    # Note that ``?`` and ``*`` match all characters but slashes.
    # '*.pyc': matches 'test.pyc' and 'pkg/test.pyc'
    # 'mod*.pyc': matches 'test/mod1.pyc' but not 'mod/1.pyc'
    # '.svn': matches 'pkg/.svn' and all of its children
    # 'build/*.o': matches 'build/lib.o' but not 'build/sub/lib.o'
    # 'build//*.o': matches 'build/lib.o' and 'build/sub/lib.o'
    prefs['ignored_resources'] = [
        '*.pyc', '*~', '.ropeproject', '.hg', '.svn', '_svn',
        '.git', '.tox', '.env', 'env', 'venv', 'node_modules',
        'bower_components'
    ]

    # Specifies which files should be considered python files.  It is
    # useful when you have scripts inside your project.  Only files
    # ending with ``.py`` are considered to be python files by
    # default.
    #prefs['python_files'] = ['*.py']

    # Custom source folders:  By default rope searches the project
    # for finding source folders (folders that should be searched
    # for finding modules).  You can add paths to that list.  Note
    # that rope guesses project source folders correctly most of the
    # time; use this if you have any problems.
    # The folders should be relative to project root and use '/' for
    # separating folders regardless of the platform rope is running on.
    # 'src/my_source_folder' for instance.
    #prefs.add('source_folders', 'src')

    # You can extend python path for looking up modules
    #prefs.add('python_path', '~/python/')

    # Should rope save object information or not.
    prefs['save_objectdb'] = True
    prefs['compress_objectdb'] = False

    # If `True`, rope analyzes each module when it is being saved.
    prefs['automatic_soa'] = True
    # The depth of calls to follow in static object analysis
    prefs['soa_followed_calls'] = 0

    # If `False` when running modules or unit tests "dynamic object
    # analysis" is turned off.  This makes them much faster.
    prefs['perform_doa'] = True

    # Rope can check the validity of its object DB when running.
    prefs['validate_objectdb'] = True

    # How many undos to hold?
    prefs['max_history_items'] = 32

    # Shows whether to save history across sessions.
    prefs['save_history'] = True
    prefs['compress_history'] = False

    # Set the number spaces used for indenting.  According to
    # :PEP:`8`, it is best to use 4 spaces.  Since most of rope's
    # unit-tests use 4 spaces it is more reliable, too.
    prefs['indent_size'] = 4

    # Builtin and c-extension modules that are allowed to be imported
    # and inspected by rope.
    prefs['extension_modules'] = []

    # Add all standard c-extensions to extension_modules list.
    prefs['import_dynload_stdmods'] = True

    # If `True` modules with syntax errors are considered to be empty.
    # The default value is `False`; When `False` syntax errors raise
    # `rope.base.exceptions.ModuleSyntaxError` exception.
    prefs['ignore_syntax_errors'] = False

    # If `True`, rope ignores unresolvable imports.  Otherwise, they
    # appear in the importing namespace.
    prefs['ignore_bad_imports'] = False

    # If `True`, rope will insert new module imports as
    # `from <package> import <module>` by default.
    prefs['prefer_module_from_imports'] = False

    # If `True`, rope will transform a comma list of imports into
    # multiple separate import statements when organizing
    # imports.
    prefs['split_imports'] = False

    # If `True`, rope will sort imports alphabetically by module name
    # instead of alphabetically by import statement, with from imports
    # after normal imports.
    prefs['sort_imports_alphabetically'] = False


def project_opened(project):
    """This function is called after opening the project"""
    # Do whatever you like here!