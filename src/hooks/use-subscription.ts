import React from "react";

import { getChannelName, useBindSubscription } from "~/utils/pusher";
import type { SubscriptionMapping } from "~/utils/subscription";

const subscribed: Record<string, boolean> = {};

export const useSubscription = <K extends keyof SubscriptionMapping>(
  event: K,
  onData: (data: SubscriptionMapping[K]) => void,
) => {
  const subscribe = useBindSubscription(getChannelName());
  React.useEffect(() => {
    if (subscribed[event]) {
      console.warn(`There is a double subscription to an event "${event}"`);
    }
    subscribed[event] = true;
    const unsubscribe = subscribe(event, onData);
    return () => {
      subscribed[event] = false;
      unsubscribe();
    };
  }, [subscribe, event, onData]);
};
