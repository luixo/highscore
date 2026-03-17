import Pusher from "pusher";

import { env } from "~/server/env";
import { getChannelName } from "~/utils/pusher";
import type { SubscriptionMapping } from "~/utils/subscription";
import { transformer } from "~/utils/transformer";

const pusherInstance = new Pusher({
  host: env.VITE_PUSHER_HOST,
  useTLS: true,
  appId: env.PUSHER_APP_ID,
  key: env.VITE_PUSHER_APP_KEY,
  secret: env.PUSHER_SECRET,
});

export const pusherTrigger = <K extends keyof SubscriptionMapping>(
  event: K,
  data: SubscriptionMapping[K],
) =>
  pusherInstance.trigger(
    getChannelName(),
    event,
    transformer.serialize({ timestamp: Date.now(), ...data }),
  );
