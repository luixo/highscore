import React from 'react';

import Pusher from 'pusher-js';
import { getChannelName, PusherMapping } from '~/utils/pusher';

let pusherInstance: Pusher | undefined;

const timestamps: Partial<Record<keyof PusherMapping, number>> = {};

const subscribed: Record<string, boolean> = {};

export const usePusher = <K extends keyof PusherMapping>(
  event: K,
  onDataRaw: (data: PusherMapping[K]) => void,
) => {
  const subscribe = React.useCallback(() => {
    if (!pusherInstance) {
      pusherInstance = new Pusher(
        process.env.NEXT_PUBLIC_PUSHER_APP_KEY ?? '',
        {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? '',
        },
      );
    }
    const channel = pusherInstance.subscribe(getChannelName());
    const onData = ({
      timestamp,
      ...data
    }: PusherMapping[K] & { timestamp: number }) => {
      const lastTimestamp = timestamps[event];
      if (lastTimestamp && lastTimestamp > timestamp) {
        return;
      }
      timestamps[event] = timestamp;
      onDataRaw(data as unknown as PusherMapping[K]);
    };
    channel.bind(event, onData);
    return () => {
      channel.unbind(event, onData);
    };
  }, [event, onDataRaw]);
  React.useEffect(() => {
    if (subscribed[event]) {
      console.warn(`There is a double subscription to an event "${event}"`);
    }
    subscribed[event] = true;
    console.log(`Subscribed to "${event}"`);
    const unsubscribe = subscribe();
    return () => {
      console.log(`Unsubscribed from "${event}"`);
      subscribed[event] = false;
      unsubscribe();
    };
  }, [subscribe, event]);
};
