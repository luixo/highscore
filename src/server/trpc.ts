import { TRPCError, initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { MODERATOR_COOKIE_KEYS } from "~/contexts/moderator-context";
import { getCookie } from "~/server/cookie";
import { getDatabase } from "~/server/database/database";
import { moderatorKeys } from "~/server/schemas";
import { transformer } from "~/utils/transformer";

const t = initTRPC.context<FetchCreateContextFnOptions>().create({
  transformer,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const { router, procedure: publicProcedure, createCallerFactory } = t;

const getEventId = async (rawInput: unknown) => {
  if (typeof rawInput !== "object" || !rawInput) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Input is not an object`,
    });
  }
  const eventId =
    "eventId" in rawInput && typeof rawInput.eventId === "string"
      ? rawInput.eventId
      : undefined;
  if (eventId) {
    return eventId;
  }
  const gameId =
    "gameId" in rawInput && typeof rawInput.gameId === "string"
      ? rawInput.gameId
      : undefined;
  if (!gameId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Input doesn't have neither gameId nor eventId.`,
    });
  }
  const db = getDatabase();
  const game = await db
    .selectFrom("games")
    .where("id", "=", gameId)
    .select("eventId")
    .executeTakeFirst();
  if (!game) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Game id "${gameId}" does not exist.`,
    });
  }
  return game.eventId;
};

export const protectedProcedure = publicProcedure.use(
  async ({ ctx, next, ...rest }) => {
    const moderatorKeysCookie = getCookie(
      ctx.req.headers.get("cookie") || "",
      MODERATOR_COOKIE_KEYS,
    );
    const keysParsedResults = moderatorKeys.safeParse(moderatorKeysCookie);
    if (!keysParsedResults.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No moderator key provided.",
      });
    }
    const eventId = await getEventId(await rest.getRawInput());
    const moderatorKey = keysParsedResults.data[eventId];
    if (!moderatorKey) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No moderator key provided.",
      });
    }
    const db = getDatabase();
    const moderator = await db
      .selectFrom("moderators")
      .where(({ and }) =>
        and({
          eventId,
          key: moderatorKey.toLowerCase(),
        }),
      )
      .select(["id", "key", "name", "role"])
      .executeTakeFirst();
    if (!moderator) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
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
  if (ctx.session.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This procedure is only used by admin.",
    });
  }
  return next();
});
