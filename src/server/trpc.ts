import {
  createTRPCClient,
  unstable_localLink as localLink,
} from "@trpc/client";
import type { FetchHandlerRequestOptions } from "@trpc/server/adapters/fetch";
import { getRequestInfo } from "@trpc/server/unstable-core-do-not-import";

import { type AppRouter, appRouter } from "~/server/routers/_app";
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
        router: appRouter,
        createContext: async () => {
          const url = new URL("/api/trpc", "http://localhost");
          const info = await getRequestInfo({
            req,
            url,
            path: url.pathname.slice(1),
            router: appRouter,
            searchParams: url.searchParams,
            headers: req.headers,
          });
          return {
            req,
            resHeaders,
            info,
          };
        },
        transformer,
        onError: (opts) => onError({ req, ...opts }),
      }),
    ],
  });
