import { Spinner } from "@heroui/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import "temporal-polyfill/global";
import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";
import type { RouterContext } from "~/routes/__root";
import { getCookies } from "~/utils/cookies";
import { createI18nContext } from "~/utils/i18n";
import { queryClientConfig } from "~/utils/query";
import { routeTree } from "./routeTree.gen";
import { getLanguage } from "./utils/i18n-internal";

export const getRouter = async () => {
	const queryClient = new QueryClient(
		queryClientConfig,
	) as RouterContext["queryClient"];
	const initialLanguage = await getLanguage();
	const i18n = createI18nContext(initialLanguage);
	const context = {
		cookies: getCookies(),
		i18n,
		queryClient,
	};
	queryClient.context = context;
	const router = createTanStackRouter({
		Wrap: ({ children }) => <i18n.Provider>{children}</i18n.Provider>,
		context,
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: NotFound,
		defaultPendingComponent: Spinner,
		defaultPreload: "intent",
		dehydrate: () => ({
			i18n: i18n.serializeContext(),
		}),
		hydrate: async (dehydratedData) => {
			await i18n.onHydrate(dehydratedData.i18n);
		},
		routeTree,
	});
	setupRouterSsrQueryIntegration({ queryClient, router });
	return router;
};

declare module "@tanstack/react-router" {
	// oxlint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Register {
		router: Awaited<ReturnType<typeof getRouter>>;
	}
}
