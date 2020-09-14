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

const chai = require('chai');
import * as TestEnv from './testsetup';
import * as GeneralUtils from '../src/utils/generalutils';
const assert = chai.assert
const expect = chai.expect

describe('GeneralUtils Tests', () => {
    after(async () => {
        TestEnv.after();
    });

    it('normalizeLifeCode makes string lowercase with dashes', async () => {
        const unnormalizedLifeCode = "Nowhere-near VaLID"
        const normalizedLifeCode = "nowhere-near-valid"
        const returnValue = GeneralUtils.normalizeLifeCode(unnormalizedLifeCode);
        assert.equal(returnValue, normalizedLifeCode)

    });

    it('normalizeLifeCode throws error when not given a string', async () => {
        const invalidLifeCode = 10
        expect(() => { GeneralUtils.normalizeLifeCode(invalidLifeCode) }).to.throw()
    });

    it('verifyStartEndTime throws error when start time less than end time', async () => {
        const start = 10
        const end = 5
        expect(() => { GeneralUtils.verifyStartEndTime(start, end) }).to.throw()
    });
});
