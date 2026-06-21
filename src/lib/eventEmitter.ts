import { EventEmitter } from 'events';

declare global {
  var globalEventEmitter: EventEmitter | undefined;
  var notificationChannel: BroadcastChannel | undefined;
}

const eventEmitter = global.globalEventEmitter || new EventEmitter();
eventEmitter.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  global.globalEventEmitter = eventEmitter;
}

if (typeof BroadcastChannel !== 'undefined' && typeof window === 'undefined') {
  if (!global.notificationChannel) {
    global.notificationChannel = new BroadcastChannel('lms_notifications');
    
    global.notificationChannel.onmessage = (event) => {
      if (event.data?.type === 'NEW_NOTIFICATION') {
        eventEmitter.emit('NEW_NOTIFICATION', event.data.payload, true);
      }
    };
    
    const originalEmit = eventEmitter.emit.bind(eventEmitter);
    eventEmitter.emit = function (eventName: string | symbol, ...args: any[]) {
      const payload = args[0];
      const fromBroadcast = args[1];
      
      if (eventName === 'NEW_NOTIFICATION' && !fromBroadcast) {
        try {
          global.notificationChannel?.postMessage({ type: 'NEW_NOTIFICATION', payload });
        } catch (e) {
          console.error('BroadcastChannel error', e);
        }
      }
      return originalEmit(eventName, ...args);
    };
  }
}

export default eventEmitter;
