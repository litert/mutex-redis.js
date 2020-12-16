/**
 * Copyright 2020 Angus.Fenying <fenying@litert.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// tslint:disable:no-console

import * as Mutex from '@litert/mutex';
import * as Redis from '@litert/redis';

import createRedisDriver from '../lib';

async function validate(
    fn: () => Promise<boolean>,
    expected: boolean,
    whileTrue: string,
    whileFalse: string,
    whileException: string,
): Promise<boolean> {

    try {

        const expectedText = expected ? whileTrue : whileFalse;
        const unexpectedText = expected ? whileFalse : whileTrue;

        if (expected === await fn()) {

            console.log(`${expectedText} [EXPECTED]`);

            return true;
        }
        else {

            console.error(`${unexpectedText} [UNEXPECTED]`);

            return false;
        }
    }
    catch {

        console.error(`${whileException} [ERROR]`);

        return false;
    }
}

(async () => {

    const mf = Mutex.createFactory();

    const redisConn = Redis.createCommandClient({
        host: '127.0.0.1',
        port: 6379
    });

    await redisConn.connect();

    mf.registerType('redis', createRedisDriver(redisConn));

    let m1 = mf.createMutex('redis', '1234');

    if (await validate(
        async () => await m1.lock(),
        true,
        '[m1] Locked successfully.',
        '[m1] Locked failed.',
        '[m1] Error!'
    )) {

        await validate(
            async () => await m1.lock(),
            false,
            '[m1] Relocked successfully.',
            '[m1] Cannot relock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m1.lock(),
            false,
            '[m1] Relocked successfully.',
            '[m1] Cannot relock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => m1.isLocked(),
            true,
            '[m1] m1 is locked.',
            '[m1] m1 is unlocked.',
            '[m1] Error!'
        );

        await validate(
            async () => m1.isExpired(),
            false,
            '[m1] m1 is expired.',
            '[m1] m1 is locked and not expired.',
            '[m1] Error!'
        );

        await validate(
            async () => await m1.unlock(),
            true,
            '[m1] Unlocked successfully.',
            '[m1] Cannot unlock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m1.lock(),
            true,
            '[m1] Locked successfully.',
            '[m1] Cannot lock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m1.lock(),
            false,
            '[m1] Relocked successfully.',
            '[m1] Cannot relock a mutex.',
            '[m1] Error!'
        );

        const m2 = mf.createMutex('redis', '1234');

        await validate(
            async () => await m2.lock(),
            false,
            '[m2] Relocked successfully.',
            '[m2] Cannot relock a mutex.',
            '[m2] Error!'
        );

        await validate(
            async () => await m2.unlock(),
            false,
            '[m2] Unlocked successfully.',
            '[m2] Cannot unlock a mutex.',
            '[m2] Error!'
        );

        await validate(
            async () => await m1.unlock(),
            true,
            '[m1] Unlocked successfully.',
            '[m1] Cannot unlock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m2.lock(),
            true,
            '[m2] Locked successfully.',
            '[m2] Cannot lock a mutex.',
            '[m2] Error!'
        );

        await validate(
            async () => await m1.lock(),
            false,
            '[m1] Relocked successfully.',
            '[m1] Cannot relock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m1.unlock(),
            false,
            '[m1] Unlocked successfully.',
            '[m1] Cannot unlock a mutex.',
            '[m1] Error!'
        );

        await validate(
            async () => await m2.unlock(),
            true,
            '[m2] Unlocked successfully.',
            '[m2] Cannot unlock a mutex.',
            '[m2] Error!'
        );

    }

    await redisConn.close();

})().catch((e) => console.error(e));
