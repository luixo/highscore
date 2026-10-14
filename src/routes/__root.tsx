/// <reference types="vite/client" />

import React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Devtools } from "~/components/devtools";
import {
	MODERATOR_COOKIE_KEYS,
	ModeratorProvider,
} from "~/contexts/moderator-context";
import { moderatorKeysSchema } from "~/server/schemas";
import appCss from "~/styles/app.css?url";
import { getCookies } from "~/utils/cookies";
import type { createI18nContext } from "~/utils/i18n";
import { TRPCProvider, getTrpcClient } from "~/utils/trpc";

const RootComponent = () => {
	const { moderatorKeys } = Route.useLoaderData();
	const queryClient = useQueryClient();
	const trpcClient = React.useMemo(() => getTrpcClient(), []);
	return (
		<TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
			<ModeratorProvider initialKeys={moderatorKeys}>
				<HeroUIProvider>
					<Outlet />
					<ToastProvider />
				</HeroUIProvider>
			</ModeratorProvider>
		</TRPCProvider>
	);
};

export type RouterContext = {
	queryClient: QueryClient & {
		context: RouterContext;
	};
	i18n: ReturnType<typeof createI18nContext>;
};

// We need loader to go before props that use it
// oxlint-disable-next-line sort-keys
export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	loader: async ({ context }) => {
		const cookies = await getCookies();
		const moderatorKeysParseResult = moderatorKeysSchema.safeParse(
			cookies[MODERATOR_COOKIE_KEYS] === undefined
				? undefined
				: decodeURIComponent(cookies[MODERATOR_COOKIE_KEYS]),
		);
		await context.i18n.loadNamespace("default");
		return {
			moderatorKeys: moderatorKeysParseResult.success
				? moderatorKeysParseResult.data
				: {},
			title: context.i18n.getTranslation()("common.title"),
		};
	},
	head: ({ loaderData }) => ({
		links: [
			{ href: appCss, rel: "stylesheet" },
			{
				href: "/apple-touch-icon.png",
				rel: "apple-touch-icon",
				sizes: "180x180",
			},
			{
				href: "/favicon-96x96.png",
				rel: "icon",
				sizes: "96x96",
				type: "image/png",
			},
			{ color: "#fffff", href: "/site.webmanifest", rel: "manifest" },
			{ href: "/favicon.ico", rel: "icon" },
		],
		meta: [
			{
				charSet: "utf8",
			},
			{
				content: "width=device-width, initial-scale=1",
				name: "viewport",
			},
			loaderData ? { title: loaderData.title } : undefined,
		],
	}),
	shellComponent: ({ children }) => (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="p-4">
				<main>{children}</main>
				<Scripts />
				<Devtools />
			</body>
		</html>
	),
});
