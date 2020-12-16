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

const mf = Mutex.createFactory();

let value: number = 0;

function sleep(ms: number): Promise<void> {

    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function executeByInterval(fn: () => Promise<any>, ms: number): Promise<void> {

    while (1) {

        await sleep(ms);

        await fn();
    }
}

const STARTED_AT = Date.now();

function now(): number {

    return Date.now() - STARTED_AT;
}

function createTask(step: number, interval: number): () => Promise<void> {

    return async function(): Promise<void> {

        const mutex = mf.createMutex('redis', 'write-value', 1000);

        if (await mutex.lock()) {

            value = value + step;

            console.log(JSON.stringify([now(), step, 'started']) + ',');

            await sleep(interval);

            await mutex.unlock();

            console.log(JSON.stringify([now(), step, 'ended']) + ',');
        }
        else {

            console.error(JSON.stringify([now(), step, 'failed']) + ',');
        }
    };
}

(async () => {

    const redisConn = Redis.createCommandClient({
        host: '127.0.0.1',
        port: 6379
    });

    await redisConn.connect();

    mf.registerType('redis', createRedisDriver(redisConn));

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    executeByInterval(createTask(1, 100), 700);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    executeByInterval(createTask(2, 400), 500);

})().catch(console.error);
