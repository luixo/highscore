import type * as trpcNext from '@trpc/server/adapters/next';

interface CreateContextOptions {
  cookies: trpcNext.NextApiRequest['cookies'];
}

export const createContextInner = (opts: CreateContextOptions) => ({
  cookies: opts.cookies,
});

export type Context = Awaited<ReturnType<typeof createContextInner>>;

export const createContext = (opts: trpcNext.CreateNextContextOptions) =>
  createContextInner({ cookies: opts.req.cookies });
