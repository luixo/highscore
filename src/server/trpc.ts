import { initTRPC, TRPCError } from '@trpc/server';
import { transformer } from '~/utils/transformer';
import type { Context } from './context';
import { prisma } from '~/server/prisma';
import { MODERATOR_COOKIE_KEYS } from '~/server/cookie';
import { moderatorKeys } from '~/server/schemas';

const t = initTRPC.context<Context>().create({
  transformer,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const { router, procedure: publicProcedure, createCallerFactory } = t;

const getEventId = async (rawInput: unknown) => {
  if (typeof rawInput !== 'object' || !rawInput) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Input is not an object`,
    });
  }
  const eventId =
    'eventId' in rawInput && typeof rawInput.eventId === 'string'
      ? rawInput.eventId
      : undefined;
  if (eventId) {
    return eventId;
  }
  const gameId =
    'gameId' in rawInput && typeof rawInput.gameId === 'string'
      ? rawInput.gameId
      : undefined;
  if (!gameId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Input doesn't have neither gameId nor eventId.`,
    });
  }
  const game = await prisma.game.findFirst({
    where: { id: gameId },
    select: { eventId: true },
  });
  if (!game) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Game id "${gameId}" does not exist.`,
    });
  }
  return game.eventId;
};

export const protectedProcedure = publicProcedure.use(
  async ({ ctx, next, ...rest }) => {
    const keysParsedResults = moderatorKeys.safeParse(
      ctx.cookies[MODERATOR_COOKIE_KEYS],
    );
    if (!keysParsedResults.success) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No moderator key provided.',
      });
    }
    const eventId = await getEventId(await rest.getRawInput());
    const moderatorKey = keysParsedResults.data[eventId];
    if (!moderatorKey) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No moderator key provided.',
      });
    }
    const moderator = await prisma.moderator.findUnique({
      where: {
        eventId,
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
  },
);

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.role !== 'Admin') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'This procedure is only used by admin.',
    });
  }
  return next();
});
