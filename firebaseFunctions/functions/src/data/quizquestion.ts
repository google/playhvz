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

export const COLLECTION_PATH = "quizQuestions";
export const FIELD__TYPE = "type";
export const FIELD__ORDER = "index";
export const FIELD__ANSWERS = "answers";
export const FIELD__ANSWER_TEXT = "text";
export const FIELD__ANSWER_ORDER = "order";
export const FIELD__ANSWER_IS_CORRECT = "isCorrect";
