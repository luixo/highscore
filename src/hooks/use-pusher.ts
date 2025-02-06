import React from 'react';

import Pusher from 'pusher-js';
import type { PusherMapping } from '~/utils/pusher';
import { getChannelName } from '~/utils/pusher';
import SuperJSON from 'superjson';
import type { SuperJSONResult } from 'superjson/dist/types';

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
      onDataRaw(SuperJSON.deserialize(data as unknown as SuperJSONResult));
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
    const unsubscribe = subscribe();
    return () => {
      subscribed[event] = false;
      unsubscribe();
    };
  }, [subscribe, event]);
};
