import { initTRPC, TRPCError } from '@trpc/server';
import { transformer } from '~/utils/transformer';
import type { Context } from './context';
import { prisma } from '~/server/prisma';
import { MODERATOR_COOKIE_NAME } from '~/server/cookie';

const t = initTRPC.context<Context>().create({
  transformer,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const { router, procedure: publicProcedure, createCallerFactory } = t;

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const moderatorKey = ctx.cookies[MODERATOR_COOKIE_NAME];
  if (typeof moderatorKey !== 'string' || !moderatorKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No moderator key provided.',
    });
  }
  const moderator = await prisma.moderator.findFirst({
    where: {
      key: moderatorKey.toLowerCase(),
    },
  });
  if (!moderator) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: `Moderator key "${moderatorKey}" not found.`,
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: moderator,
    },
  });
});
