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

import * as Universal from './universal';

export const COLLECTION_PATH = "rewards";
export const FIELD__ID = Universal.FIELD__USER_ID;
export const FIELD__MANAGED = "managed";
export const FIELD__SHORT_NAME = "shortName";
export const FIELD__LONG_NAME = "longName";
export const FIELD__DESCRIPTION = "description";
export const FIELD__IMAGE_URL = "imageUrl";
export const FIELD__POINTS = "points";

export function create(
  shortName: string,
  longName: string,
  description: string,
  imageUrl: string,
  points: number
): { [key: string]: any; } {
  return {
    [FIELD__SHORT_NAME]: shortName,
    [FIELD__LONG_NAME]: longName,
    [FIELD__DESCRIPTION]: description,
    [FIELD__IMAGE_URL]: imageUrl,
    [FIELD__POINTS]: points,
    [FIELD__MANAGED]: false
  };
}

export function createManagedReward(
  shortName: string,
  longName: string,
  description: string,
  imageUrl: string,
  points: number
): { [key: string]: any; } {
  return {
    [FIELD__SHORT_NAME]: shortName,
    [FIELD__LONG_NAME]: longName,
    [FIELD__DESCRIPTION]: description,
    [FIELD__IMAGE_URL]: imageUrl,
    [FIELD__POINTS]: points,
    [FIELD__MANAGED]: true
  };
}