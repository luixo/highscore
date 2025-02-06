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

export const protectedProcedure = publicProcedure.use(
  async ({ ctx, next, ...rest }) => {
    const moderatorKey = ctx.cookies[MODERATOR_COOKIE_NAME];
    if (typeof moderatorKey !== 'string' || !moderatorKey) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'No moderator key provided.',
      });
    }
    const moderators = await prisma.moderator.findMany({
      where: {
        key: moderatorKey.toLowerCase(),
      },
    });
    if (moderators.length === 0) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: `No matches for moderator key "${moderatorKey}" was found.`,
      });
    }
    const rawInput = await rest.getRawInput();
    if (typeof rawInput !== 'object' || !rawInput) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Input is not an object`,
      });
    }
    const gameId =
      'gameId' in rawInput && typeof rawInput.gameId === 'string'
        ? rawInput.gameId
        : undefined;
    let eventId =
      'eventId' in rawInput && typeof rawInput.eventId === 'string'
        ? rawInput.eventId
        : undefined;
    if (!eventId && !gameId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Input doesn't have neither gameId nor eventId.`,
      });
    }
    if (gameId) {
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
      eventId = game.eventId;
    }
    const moderator = moderators.find(
      (moderator) => moderator.eventId === eventId,
    );
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
