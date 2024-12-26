import { protectedProcedure } from '~/server/trpc';

export const procedure = protectedProcedure.query(({ ctx }) => {
  return ctx.session;
});
