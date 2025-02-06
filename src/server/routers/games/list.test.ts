import { createContextInner } from '~/server/context';
import { createCallerFactory, router } from '~/server/trpc';

import { procedure } from './list';

test('get list of games', async () => {
  const ctx = createContextInner({ cookies: {} });
  const caller = createCallerFactory(router({ procedure }))(ctx);
  const games = await caller.procedure({ eventId: 'unknown' });
  expect(games).toMatchObject<typeof games>([
    {
      id: 'unknown',
      title: 'Demo',
      formatters: {
        serializers: {
          one: '%s coin',
          some: '%s coins',
          many: '%s coins',
        },
      },
      logoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      sortDirection: 'Asc',
      formatScore: null,
      eventId: 'unknown',
    },
  ]);
});
