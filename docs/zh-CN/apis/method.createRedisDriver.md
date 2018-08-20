# 模块方法 createIntraprocessDriver

该方法用于创建一个基于 Redis 的互斥量驱动对象。

```ts
function createRedisDriver(
    redis: Redis.RedisClient,
    namespace: string = DEFAULT_NAMESPACE,
    keyBuilder: IKeyBuilder = DEFAULT_KEY_BUILDER
): Mutex.IDriver;
```

## 参数说明

### - `redis: Redis.RedisClient`

该参数用于提供一个可用的 Redis 客户端对象，用于连接 Redis 服务器。

### - `namespace: string`

该参数用于设置一个命名空间，用于划分互斥量的作用域。

同一个命名空间里的互斥量不能重名，而不同的命名空间之间则可以，彼此互不干扰。

> 默认值： **default**

### - `keyBuilder: IKeyBuilder`

该参数用于构建互斥量在 Redis 内的 Key。

```ts
type IKeyBuilder = (namespace: string, key: string) => string;
```

默认值：

```ts
const DEFAULT_KEY_BUILDER: IKeyBuilder = function(
    namespace: string,
    key: string
): string {

    return `mutex:${namespace}:${key}`;
};
```
