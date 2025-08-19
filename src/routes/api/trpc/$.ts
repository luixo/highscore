import type {
  ServerFileRoutesByPath,
  ServerRouteMethodRecordValue,
} from "@tanstack/react-start/server";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "~/server/routers/_app";

type Callback = Extract<
  ServerRouteMethodRecordValue<
    ServerFileRoutesByPath["/api/trpc/$"]["parentRoute"],
    "/api/trpc/$",
    undefined
  >,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  Function
>;

const callback: Callback = async ({ request }) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: (opts) => opts,
    onError: ({ error, type, path, ctx }) => {
      /* c8 ignore start */
      if (!ctx) {
        return;
      }
      /* c8 ignore stop */
      if (error.code === "UNAUTHORIZED" && path === "account.get") {
        // Do not log an attempt to fetch the account without a cookie
        return;
      }
      console.error(
        `[${error.code}] [${
          ctx.req.headers.get("user-agent") ?? "no-user-agent"
        }] ${type} "${path}": ${error.message}`,
      );
    },
  });

export const ServerRoute = createServerFileRoute("/api/trpc/$").methods({
  GET: callback,
  POST: callback,
});
