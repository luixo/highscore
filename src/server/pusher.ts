import Pusher from "pusher";

import { env } from "~/server/env";
import { getChannelName } from "~/utils/pusher";
import type { SubscriptionMapping } from "~/utils/subscription";
import { transformer } from "~/utils/transformer";

const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.VITE_PUSHER_APP_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.VITE_PUSHER_CLUSTER,
});

export const pusherTrigger = <K extends keyof SubscriptionMapping>(
  event: K,
  data: SubscriptionMapping[K],
) =>
  pusher.trigger(
    getChannelName(),
    event,
    transformer.serialize({ timestamp: Date.now(), ...data }),
  );
