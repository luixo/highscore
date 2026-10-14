import { createFileRoute, redirect } from "@tanstack/react-router";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Page } from "~/pages/event";
import { getTrpcClient } from "~/utils/trpc";

const Wrapper = () => {
	const { id } = Route.useParams();
	return <Page idOrAlias={id} />;
};
export const Route = createFileRoute("/events/$id")({
	component: Wrapper,
	loader: async ({ params, context }) => {
		const trpc = createTRPCOptionsProxy({
			client: getTrpcClient(),
			queryClient: context.queryClient,
		});
		let targetRedirect: string | undefined = undefined;
		try {
			const result = await context.queryClient.query(
				trpc.events.getByAlias.queryOptions({
					idOrAlias: params.id,
				}),
			);
			targetRedirect =
				result.alias !== undefined && result.alias !== params.id
					? result.alias
					: undefined;
			await Promise.all([
				context.queryClient
					.query(trpc.events.get.queryOptions({ id: result.id }))
					.catch(() => {
						/* empty */
					}),
				context.queryClient
					.query(trpc.moderator.get.queryOptions({ eventId: result.id }))
					.catch(() => {
						/* empty */
					}),
			]);
		} catch {
			/* empty */
		}
		if (targetRedirect !== undefined) {
			// oxlint-disable-next-line typescript/only-throw-error
			throw redirect({
				params: { id: targetRedirect },
				to: "/events/$id",
			});
		}
	},
});
