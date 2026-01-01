import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "~/server/routers/_app";

const callback = async (request: Request) =>
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

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }) => callback(request),
      POST: ({ request }) => callback(request),
    },
  },
});
