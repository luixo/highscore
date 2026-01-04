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

export const getRouter = () => {
  const queryClient = new QueryClient(
    queryClientConfig,
  ) as RouterContext["queryClient"];
  const i18n = createI18nContext();
  const context = {
    cookies: getCookies(),
    queryClient,
    i18n,
  };
  queryClient.context = context;
  const router = createTanStackRouter({
    context,
    dehydrate: () => ({
      i18n: i18n.serializeContext(),
    }),
    hydrate: async (dehydratedData) => {
      await i18n.onHydrate(dehydratedData.i18n);
    },
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: Spinner,
    Wrap: ({ children }) => <i18n.Provider>{children}</i18n.Provider>,
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
};

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
