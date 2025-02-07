import { publicProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import {
  eventNameSchema,
  moderatorKeySchema,
  moderatorNameSchema,
} from '~/server/schemas';

export const procedure = publicProcedure
  .input(
    z.object({
      title: eventNameSchema,
      adminName: moderatorNameSchema,
      adminKey: moderatorKeySchema,
    }),
  )
  .mutation(async ({ input: { title, adminKey, adminName } }) => {
    const result = await prisma.event.create({
      data: {
        title,
      },
      select: {
        id: true,
        title: true,
      },
    });
    await prisma.moderator.create({
      data: {
        eventId: result.id,
        name: adminName,
        key: adminKey,
        role: 'Admin',
      },
    });
    return result;
  });
