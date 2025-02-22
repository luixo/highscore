import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import {
  eventIdSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from '~/server/schemas';

export const procedure = adminProcedure
  .input(
    z.object({
      eventId: eventIdSchema,
      key: moderatorKeySchema,
      name: moderatorNameSchema,
    }),
  )
  .mutation(async ({ input: { eventId, key, name } }) => {
    const result = await prisma.moderator.upsert({
      where: {
        eventId,
        key: key.toLowerCase(),
      },
      create: {
        eventId,
        key: key.toLowerCase(),
        name,
        role: 'Moderator',
      },
      update: {
        name: name + '1',
      },
    });
    console.log('res', {
      eventId,
      key: key.toLowerCase(),
      name,
      role: 'Moderator',
    });
    return result;
  });
