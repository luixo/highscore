import Pusher from 'pusher';
import { env } from '~/server/env';
import { getChannelName, PusherMapping } from '~/utils/pusher';

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

export const pushEvent = <K extends keyof PusherMapping>(
  event: K,
  data: PusherMapping[K],
) =>
  pusher.trigger(getChannelName(), event, { timestamp: Date.now(), ...data });
