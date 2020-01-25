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
import * as Defaults from './defaults';

export const COLLECTION_PATH = "players";
export const FIELD__USER_ID = Universal.FIELD__USER_ID;
export const FIELD__NAME = "name";
export const FIELD__AVATAR_URL = "avatarUrl";
export const FIELD__ALLEGIANCE = "allegiance";

export function create(userId: string, name: string): { [key: string]: string; } {
  return {
    [FIELD__USER_ID]: userId,
    [FIELD__NAME]: name,
    [FIELD__AVATAR_URL]: getDefaultProfilePic(name),
    [FIELD__ALLEGIANCE]: Defaults.allegiance
  };
}

function getDefaultProfilePic(name: string) {
	if (!name) {
		return '';
	}

	const defaultProfilePics = [
		'https://goo.gl/WMMjhe',
		'https://goo.gl/haNJsE',
		'https://goo.gl/rRHGus',
		'https://goo.gl/RfK87d',
		'https://goo.gl/0WvZKs',
		'https://goo.gl/aEI2Uj',
		'https://goo.gl/tJ0HSe',
		'https://goo.gl/bbJGzW',
		'https://goo.gl/HcmpLi',
		'https://goo.gl/pEjp5M',
		'https://goo.gl/kNH2ov',
		'https://goo.gl/gBQ1Kx',
		'https://goo.gl/ExqDyF',
		'https://goo.gl/Aj3pPs',
		'https://goo.gl/TjCmuh',
		'https://goo.gl/zxDxMU',
		'https://goo.gl/tGCRrj',
		'https://goo.gl/ogxpAV',
		'https://goo.gl/QNwVag',
		'https://goo.gl/4rC7x6',
		'https://goo.gl/WpYtzt',
		'https://goo.gl/eNMPd1',
		'https://goo.gl/dEDG56',
		'https://goo.gl/o12QaU',
		'https://goo.gl/T3HFne',
		'https://goo.gl/8aRqJ4',
		'https://goo.gl/dqPjE2',
		'https://goo.gl/cHqQwU',
	];

	const hash = Math.abs(hashName(name));
	const index = hash % defaultProfilePics.length;
	return defaultProfilePics[index];
};


function hashName(name: string): number {
    var hash: number = 0;
    if (name.length == 0) return hash;
    for (let i= 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};