import { pusherTrigger } from "~/server/pusher";
import type { SubscriptionMapping } from "~/utils/subscription";

export const pushEvent = <K extends keyof SubscriptionMapping>(
  event: K,
  data: SubscriptionMapping[K],
) => pusherTrigger(event, data);
