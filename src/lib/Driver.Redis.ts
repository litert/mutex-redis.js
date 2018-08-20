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

import * as Mutex from "@litert/mutex";
import * as Redis from "@litert/redis";
import {
    IKeyBuilder,
    DEFAULT_NAMESPACE,
    DEFAULT_KEY_BUILDER
} from "./Common";

const LUA_LOCK: string = `if 1 == redis.call('setnx', KEYS[1], ARGV[1]) then

    if 1 == redis.call('pexpireat', KEYS[1], ARGV[2]) then

        return 1;
    end

    redis.call('del', KEYS[1])
end

return 0`;

const LUA_UNLOCK: string = `local val = redis.call('get', KEYS[1])

if val == ARGV[1] then

    return redis.call('del', KEYS[1])
end

return 0`;

const LUA_CHECK: string = `local val = redis.call('get', KEYS[1])

if val == ARGV[1] then

    return 1
end

return 0`;

class RedisDriver
implements Mutex.IDriver {

    private _redis: Redis.RedisClient;

    private _ns: string;

    private _buildKey: IKeyBuilder;

    private _luaLockId!: string;

    private _luaUnlockId!: string;

    private _luaCheckId!: string;

    public constructor(
        redis: Redis.RedisClient,
        namespace: string = DEFAULT_NAMESPACE,
        keyBuilder: IKeyBuilder = DEFAULT_KEY_BUILDER
    ) {

        this._redis = redis;
        this._ns = namespace;
        this._buildKey = keyBuilder;

        this._luaCheckId = "cc5e3d7f05b5e6c28c556242d5a24eece2a1ae2a";
        this._luaLockId = "3a971c811a10347bbdee17970f8b6ed3cb6fd7f7";
        this._luaUnlockId = "d03dcdcd1e51e59673c900e403199e9544f77b26";
    }

    private async _registerLuaScripts(): Promise<void> {

        this._luaLockId = await this._redis.scriptLoad(LUA_LOCK);

        this._luaUnlockId = await this._redis.scriptLoad(LUA_UNLOCK);

        this._luaCheckId = await this._redis.scriptLoad(LUA_CHECK);
    }

    public async lock(
        key: string,
        token: string,
        expiringAt: number
    ): Promise<boolean> {

        if (!expiringAt) {

            return !!await this._redis.setNX(
                this._buildKey(this._ns, key),
                token
            );
        }

        let retriable = true;

        do {

            try {

                return !!await this._redis.evalSHA(
                    this._luaLockId,
                    [ this._buildKey(this._ns, key) ],
                    [ token, expiringAt.toString() ]
                );
            }
            catch (e) {

                if (!retriable) {

                    return false;
                }

                if (e.message && e.message.startsWith("NOSCRIPT")) {

                    await this._registerLuaScripts();
                }

                retriable = false;
            }
        }
        while (1);

        return false;
    }

    public async unlock(
        key: string,
        token: string
    ): Promise<boolean> {

        let retriable = true;

        do {

            try {

                return !!await this._redis.evalSHA(
                    this._luaUnlockId,
                    [ this._buildKey(this._ns, key) ],
                    [ token ]
                );
            }
            catch (e) {

                if (!retriable) {

                    return false;
                }

                if (e.message && e.message.startsWith("NOSCRIPT")) {

                    await this._registerLuaScripts();
                }

                retriable = false;
            }
        }
        while (1);

        return false;
    }

    public async checkLocked(
        key: string,
        token: string
    ): Promise<boolean> {

        let retriable = true;

        do {

            try {

                return !!await this._redis.evalSHA(
                    this._luaCheckId,
                    [ this._buildKey(this._ns, key) ],
                    [ token ]
                );
            }
            catch (e) {

                if (!retriable) {

                    return false;
                }

                if (e.message && e.message.startsWith("NOSCRIPT")) {

                    await this._registerLuaScripts();
                }

                retriable = false;
            }
        }
        while (1);

        return false;
    }
}

/**
 * Create a driver for Redis.
 */
export function createRedisDriver(
    redis: Redis.RedisClient,
    namespace: string = DEFAULT_NAMESPACE,
    keyBuilder: IKeyBuilder = DEFAULT_KEY_BUILDER
): Mutex.IDriver {

    return new RedisDriver(
        redis, namespace, keyBuilder
    );
}
