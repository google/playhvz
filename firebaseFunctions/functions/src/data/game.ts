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


export const COLLECTION_PATH = "games";
export const FIELD__NAME = "name";
export const FIELD__START_TIME = "startTime";
export const FIELD__END_TIME = "endTime";
export const FIELD__CREATOR_USER_ID = "creatorUserId";
export const FIELD__RULES = "rules";
export const FIELD__FAQ = "faq";
export const FIELD__ADMIN_GROUP_ID = "adminGroupId";
export const FIELD__ADMIN_ON_CALL_PLAYER_ID = "adminOnCallPlayerId";
export const FIELD__FIGUREHEAD_ADMIN_PLAYER_ACCOUNT = "figureheadAdminPlayerAccount";
export const FIELD__INFECT_REWARD_ID = "infectRewardId";
export const FIELD__STAT_ID = "statId";

export function create(
  creatorUserId: string,
  name: string,
  startTime: number,
  endTime: number
): { [key: string]: any; } {
  return {
    [FIELD__CREATOR_USER_ID]: creatorUserId,
    [FIELD__NAME]: name,
    [FIELD__START_TIME]: startTime,
    [FIELD__END_TIME]: endTime
  };
}