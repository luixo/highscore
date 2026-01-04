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

import type { AppRouter } from "~/server/routers/_app";
import { getLocalTrpcClient } from "~/server/trpc";
import { proxyMethods } from "~/utils/proxy";

import { transformer } from "./transformer";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const baseUrl = `${getBaseUrl()}/api/trpc`;
export const links = [
  loggerLink({
    enabled: (opts) =>
      process.env.NODE_ENV === "development" ||
      (opts.direction === "down" && opts.result instanceof Error),
  }),
  splitLink({
    condition: (op) => op.input instanceof FormData,
    true: httpLink({ url: baseUrl, transformer }),
    false: httpBatchStreamLink({
      url: baseUrl,
      transformer,
    }),
  }),
];

export const getTrpcClient = createIsomorphicFn()
  .client(() => createTRPCClient<AppRouter>({ links }))
  .server(() => {
    const headers = proxyMethods(new Headers(), {
      append: (name, value) => {
        setResponseHeader(name, value);
      },
      set: (name, value) => {
        setResponseHeader(name, value);
      },
      delete: (name) => {
        removeResponseHeader(name);
      },
    });
    return getLocalTrpcClient({ req: getRequest(), resHeaders: headers });
  });

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
