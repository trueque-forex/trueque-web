
const Redis = require('ioredis');
require('dotenv').config({ path: '.env' });

const redis = new Redis(process.env.REDIS_URL);

redis.flushdb().then((res) => {
    console.log('Redis FLUSHDB:', res);
    redis.quit();
}).catch(err => {
    console.error('Redis Error:', err);
    process.exit(1);
});
