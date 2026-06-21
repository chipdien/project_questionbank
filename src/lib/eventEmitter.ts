import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { serializeBigInt } from '@/lib/utils/serialization.utils';

declare global {
  var globalEventEmitter: EventEmitter | undefined;
  var redisPublisher: Redis | undefined;
  var redisSubscriber: Redis | undefined;
}

const eventEmitter = global.globalEventEmitter || new EventEmitter();
eventEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  global.globalEventEmitter = eventEmitter;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (typeof window === 'undefined') {
  if (!global.redisPublisher) {
    global.redisPublisher = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    global.redisPublisher.on('error', (err: any) => {
      console.error('--- [REDIS] Publisher Error:', err.message);
    });
  }
  if (!global.redisSubscriber) {
    global.redisSubscriber = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    global.redisSubscriber.on('error', (err: any) => {
      console.error('--- [REDIS] Subscriber Error:', err.message);
    });

    global.redisSubscriber.subscribe('lms_notifications', (err) => {
      if (err) {
        console.error('--- [REDIS] Failed to subscribe to lms_notifications channel:', err.message);
      } else {
        console.log('--- [REDIS] Successfully subscribed to lms_notifications channel');
      }
    });

    global.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'lms_notifications') {
        try {
          const payload = JSON.parse(message);
          eventEmitter.emit('NEW_NOTIFICATION', payload, true);
        } catch (e: any) {
          console.error('--- [REDIS] Failed to parse redis notification message:', e.message);
        }
      }
    });

    const originalEmit = eventEmitter.emit.bind(eventEmitter);
    eventEmitter.emit = function (eventName: string | symbol, ...args: any[]) {
      const payload = args[0];
      const fromRedis = args[1];

      if (eventName === 'NEW_NOTIFICATION' && !fromRedis) {
        try {
          const serialized = serializeBigInt(payload);
          console.log('--- [REDIS] Publishing new notification to Redis:', serialized.id);
          global.redisPublisher?.publish('lms_notifications', JSON.stringify(serialized));
        } catch (e: any) {
          console.error('--- [REDIS] Publish error:', e.message);
        }
      }
      return originalEmit(eventName, ...args);
    };
  }
}

export default eventEmitter;
