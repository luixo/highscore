import { adminProcedure } from '~/server/trpc';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import { moderatorKeySchema, moderatorNameSchema } from '~/server/schemas';

export const procedure = adminProcedure
  .input(z.object({ key: moderatorKeySchema, name: moderatorNameSchema }))
  .mutation(async ({ input: { key, name } }) => {
    const result = await prisma.moderator.upsert({
      where: {
        key: key.toLowerCase(),
      },
      create: {
        key: key.toLowerCase(),
        name,
        role: 'Moderator',
      },
      update: {},
    });
    return result;
  });
