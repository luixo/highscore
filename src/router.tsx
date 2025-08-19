import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { serverOnly } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { NotFound } from "~/components/not-found";

import { routeTree } from "./routeTree.gen";

export const createRouter = () => {
  const request = import.meta.env.SSR ? serverOnly(getWebRequest)() : null;
  const router = createTanStackRouter({
    context: {
      request,
    },
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });

  return router;
};

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
