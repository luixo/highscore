import Pusher from 'pusher';
import SuperJSON from 'superjson';
import { env } from '~/server/env';
import type { PusherMapping } from '~/utils/pusher';
import { getChannelName } from '~/utils/pusher';

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
  pusher.trigger(
    getChannelName(),
    event,
    SuperJSON.serialize({ timestamp: Date.now(), ...data }),
  );
