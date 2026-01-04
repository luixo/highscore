import { createFileRoute, redirect } from "@tanstack/react-router";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { Page } from "~/pages/event";
import { getTrpcClient } from "~/utils/trpc";

const Wrapper = () => {
  const { id } = Route.useParams();
  return <Page idOrAlias={id} />;
};
export const Route = createFileRoute("/events/$id")({
  loader: async ({ params, context }) => {
    const trpc = createTRPCOptionsProxy({
      queryClient: context.queryClient,
      client: getTrpcClient(),
    });
    let targetRedirect: string | undefined;
    try {
      const result = await context.queryClient.fetchQuery(
        trpc.events.getByAlias.queryOptions({
          idOrAlias: params.id,
        }),
      );
      targetRedirect =
        result.alias && result.alias !== params.id ? result.alias : undefined;
      await Promise.all([
        context.queryClient.prefetchQuery(
          trpc.events.get.queryOptions({ id: result.id }),
        ),
        context.queryClient.prefetchQuery(
          trpc.moderator.get.queryOptions({ eventId: result.id }),
        ),
      ]);
    } catch {
      /* empty */
    }
    if (targetRedirect) {
      throw redirect({
        to: "/events/$id",
        params: { id: targetRedirect },
      });
    }
  },
  component: Wrapper,
});
