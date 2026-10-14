import { createIsomorphicFn } from "@tanstack/react-start";
import {
	getRequest,
	removeResponseHeader,
	setResponseHeader,
} from "@tanstack/react-start/server";
import {
	createTRPCClient,
	httpBatchStreamLink,
	httpLink,
	loggerLink,
	splitLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { env } from "~/server/env";
import type { AppRouter } from "~/server/routers/_app";
import { getLocalTrpcClient } from "~/server/trpc";
import { proxyMethods } from "~/utils/proxy";
import { transformer } from "./transformer";

const getBaseUrl = () => {
	if (typeof window !== "undefined") {
		return "";
	}
	return `http://localhost:${env.PORT}`;
};

const baseUrl = `${getBaseUrl()}/api/trpc`;
export const links = [
	loggerLink({
		enabled: (opts) =>
			env.NODE_ENV === "development" ||
			(opts.direction === "down" && opts.result instanceof Error),
	}),
	splitLink({
		condition: (op) => op.input instanceof FormData,
		false: httpBatchStreamLink({
			transformer,
			url: baseUrl,
		}),
		true: httpLink({ transformer, url: baseUrl }),
	}),
];

export const getTrpcClient = createIsomorphicFn()
	.client(() => createTRPCClient<AppRouter>({ links }))
	.server(() => {
		const headers = proxyMethods(new Headers(), {
			append: (name, value) => {
				setResponseHeader(name, value);
			},
			delete: (name) => {
				removeResponseHeader(name);
			},
			set: (name, value) => {
				setResponseHeader(name, value);
			},
		});
		return getLocalTrpcClient({ req: getRequest(), resHeaders: headers });
	});

export const { TRPCProvider, useTRPC, useTRPCClient } =
	createTRPCContext<AppRouter>();
