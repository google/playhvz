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


export const COLLECTION_PATH = "stats";
export const FIELD__CURRENT_HUMAN_COUNT = "currentHumanCount";
export const FIELD__CURRENT_ZOMBIE_COUNT = "currentZombieCount";
export const FIELD__STARTER_ZOMBIE_COUNT = "starterZombieCount";
export const FIELD__IS_OUT_OF_DATE = "isOutOfDate";
export const FIELD__STATS_OVER_TIME = "statsOverTime";
export const FIELD__OVER_TIME_TIMESTAMP = "timestamp";
export const FIELD__OVER_TIME_INFECTION_COUNT = "infectionCount";

export function create(
  currentHumanCount: number,
  currentZombieCount: number,
  starterZombieCount: number,
  statsOverTime: any
): { [key: string]: any; } {
  return {
    [FIELD__CURRENT_HUMAN_COUNT]: currentHumanCount,
    [FIELD__CURRENT_ZOMBIE_COUNT]: currentZombieCount,
    [FIELD__STARTER_ZOMBIE_COUNT]: starterZombieCount,
    [FIELD__IS_OUT_OF_DATE]: false,
    [FIELD__STATS_OVER_TIME]: statsOverTime
  };
}

export function createStatOverTime(interval: number, infectionCount: number): { [key: string]: any; } {
  return {
    [FIELD__OVER_TIME_TIMESTAMP]: interval,
    [FIELD__OVER_TIME_INFECTION_COUNT]: infectionCount
  }
}

export function formattedForReturn(stat: any): { [key: string]: any; } {
  return {
    [FIELD__CURRENT_HUMAN_COUNT]: stat[FIELD__CURRENT_HUMAN_COUNT],
    [FIELD__CURRENT_ZOMBIE_COUNT]: stat[FIELD__CURRENT_ZOMBIE_COUNT],
    [FIELD__STARTER_ZOMBIE_COUNT]: stat[FIELD__STARTER_ZOMBIE_COUNT],
    [FIELD__IS_OUT_OF_DATE]: stat[FIELD__IS_OUT_OF_DATE],
    [FIELD__STATS_OVER_TIME]: stat[FIELD__STATS_OVER_TIME]
  }
}