/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Defaults from './defaults';

export const COLLECTION_PATH = "groups";
export const FIELD__NAME = "name";
export const FIELD__MANAGED = "managed";
export const FIELD__OWNERS = "owners";
export const FIELD__SETTINGS = "settings";
export const FIELD__MEMBERS = "members";
export const FIELD__SETTINGS_ADD_SELF = "canAddSelf";
export const FIELD__SETTINGS_ADD_OTHERS = "canAddOthers";
export const FIELD__SETTINGS_REMOVE_SELF = "canRemoveSelf";
export const FIELD__SETTINGS_REMOVE_OTHERS = "canRemoveOthers";
export const FIELD__SETTINGS_AUTO_ADD = "autoAdd";
export const FIELD__SETTINGS_AUTO_REMOVE = "autoRemove";
export const FIELD__SETTINGS_ALLEGIANCE_FILTER = "allegianceFilter";

export function create(name: string, managed: boolean, settings: any): { [key: string]: any; } {
  return {
    [FIELD__NAME]: name,
    [FIELD__MANAGED]: managed,
    [FIELD__OWNERS]: [],
    [FIELD__SETTINGS]: settings,
    [FIELD__MEMBERS]: []
  };
}

export function getGlobalGroupSettings() {
  return {
    [FIELD__SETTINGS_ADD_SELF]: false,
    [FIELD__SETTINGS_ADD_OTHERS]: false,
    [FIELD__SETTINGS_REMOVE_SELF]: false,
    [FIELD__SETTINGS_REMOVE_OTHERS]: false,
    [FIELD__SETTINGS_AUTO_ADD]: true,
    [FIELD__SETTINGS_AUTO_REMOVE]: false,
    [FIELD__SETTINGS_ALLEGIANCE_FILTER]: Defaults.allegianceFilter
  }
}



