import {
	createTRPCClient,
	unstable_localLink as localLink,
} from "@trpc/client";
import type { FetchHandlerRequestOptions } from "@trpc/server/adapters/fetch";
import { getRequestInfo } from "@trpc/server/unstable-core-do-not-import";
import { appRouter } from "~/server/routers/_app";
import type { AppRouter } from "~/server/routers/_app";
import { transformer } from "~/utils/transformer";

export const onError: NonNullable<
	FetchHandlerRequestOptions<AppRouter>["onError"]
> = ({ error, type, path, ctx }) => {
	/* c8 ignore start */
	if (!ctx) {
		return;
	}
	/* c8 ignore stop */
	if (error.code === "UNAUTHORIZED" && path === "account.get") {
		// Do not log an attempt to fetch the account without a cookie
		return;
	}
	// oxlint-disable-next-line no-console
	console.error(
		`[${error.code}] [${
			ctx.req.headers.get("user-agent") ?? "no-user-agent"
		}] ${type} "${path}": ${error.message}`,
	);
};

export const getLocalTrpcClient = ({
	req,
	resHeaders,
}: {
	req: Request;
	resHeaders: Headers;
}) =>
	createTRPCClient<typeof appRouter>({
		links: [
			localLink({
				createContext: async () => {
					const url = new URL("/api/trpc", "http://localhost");
					const info = await getRequestInfo({
						headers: req.headers,
						path: url.pathname.slice(1),
						req,
						router: appRouter,
						searchParams: url.searchParams,
						url,
					});
					return {
						info,
						req,
						resHeaders,
					};
				},
				onError: (opts) => onError({ req, ...opts }),
				router: appRouter,
				transformer,
			}),
		],
	});
