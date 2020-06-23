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

/*************************************************************
 * Current structure of a Player document:
 *
 * Player
 *    UserId - [private] user associated with this player
 *    Name - [public] nickname
 *    AvatarUrl - [public] image url
 *    Allegiance - [public] player's allegiance/team
 *
 ************************************************************/

import * as Defaults from './defaults';
import * as Universal from './universal';

export const COLLECTION_PATH = "claimCodes";
export const FIELD__ID = Universal.FIELD__USER_ID;
export const FIELD__CODE = "code";
export const FIELD__REDEEMER = "redeemer";

export function create(code: string): { [key: string]: any; } {
  return {
    [FIELD__CODE]: code,
    [FIELD__REDEEMER]: Defaults.EMPTY_REWARD_REDEEMER
  };
}
