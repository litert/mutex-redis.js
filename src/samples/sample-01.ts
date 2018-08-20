/**
 *  Copyright 2018 Angus.Fenying <fenying@litert.org>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

// tslint:disable:no-console

import * as Mutex from "@litert/mutex";
import * as Redis from "@litert/redis";

import createRedisDriver from "../lib";

(async () => {

    const mf = Mutex.createFactory();

    mf.registerType("redis", createRedisDriver(
        await Redis.createRedisClient({
            host: "127.0.0.1",
            port: 6379
        })
    ));

    let m1 = mf.createMutex("redis", "1234");

    if (await m1.lock()) {

        console.log("[m1] Locked successfully.");

        if (!await m1.lock()) {

            console.log("[m1] Cannot relock a mutex.");
        }

        if (!await m1.lock()) {

            console.log("[m1] Cannot relock a mutex.");
        }

        if (m1.isLocked()) {

            console.log("[m1] m1 is locked.");
        }

        if (m1.isExpired()) {

            console.log("[m1] m1 is expired.");
        }

        if (await m1.unlock()) {

            console.log("[m1] Unlocked successfully.");
        }

        if (!await m1.lock()) {

            console.log("[m1] Cannot relock a mutex.");
        }

        const m2 = mf.createMutex("redis", "1234");

        if (await m2.lock()) {

            console.log("[m2] Locked successfully.");
        }
        else {

            console.log("[m2] Failed to lock.");
        }

        if (await m2.unlock()) {

            console.log("[m2] Unlocked successfully.");
        }
        else {

            console.warn("[m2] Failed to unlock.");
        }

        if (await m1.unlock()) {

            console.log("[m1] Unlocked successfully.");
        }

        if (await m1.lock()) {

            console.log("[m1] Locked successfully.");
        }

        if (await m1.unlock()) {

            console.log("[m1] Unlocked successfully.");
        }

    }

})();
