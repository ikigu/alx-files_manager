import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log(err));
    this.redisConnected = false;
    this.client.on('connect', () => {
      this.redisConnected = true;
    });
  }

  isAlive() {
    return this.redisConnected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    const val = await getAsync(key);
    return val;
  }

  async set(key, val, dur) {
    const setAsync = promisify(this.client.set).bind(this.client);
    await setAsync(key, val, 'EX', dur);
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    await delAsync(key);
  }
}

export const redisClient = new RedisClient();

export default redisClient;
