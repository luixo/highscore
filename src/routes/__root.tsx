/// <reference types="vite/client" />

import React from "react";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { createTRPCClient } from "@trpc/client";
import { parse } from "cookie";

import { DefaultCatchBoundary } from "~/components/default-catch-boundary";
import { Devtools } from "~/components/devtools";
import { NotFound } from "~/components/not-found";
import {
  MODERATOR_COOKIE_KEYS,
  ModeratorProvider,
} from "~/contexts/moderator-context";
import type { AppRouter } from "~/server/routers/_app";
import { moderatorKeys } from "~/server/schemas";
import appCss from "~/styles/app.css?url";
import { queryClientConfig } from "~/utils/query";
import { TRPCProvider, links } from "~/utils/trpc";

const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [queryClient] = React.useState(
    () => new QueryClient(queryClientConfig),
  );
  const [trpcClient] = React.useState(() =>
    createTRPCClient<AppRouter>({ links }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
};

const RootComponent = () => {
  const { moderatorKeys } = Route.useLoaderData();
  return (
    <ModeratorProvider initialKeys={moderatorKeys}>
      <HeroUIProvider>
        <Outlet />
        <ToastProvider />
      </HeroUIProvider>
    </ModeratorProvider>
  );
};

type RouterContext = {
  request: Request | null;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Книга рекордов" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96x96.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootComponent,
  loader: async (ctx) => {
    const request = ctx.context.request;
    const cookies = parse(
      request ? request.headers.get("cookie") || "" : document.cookie,
    );
    const parsedKeys = moderatorKeys.safeParse(
      cookies[MODERATOR_COOKIE_KEYS]
        ? decodeURIComponent(cookies[MODERATOR_COOKIE_KEYS])
        : undefined,
    );
    return { moderatorKeys: parsedKeys.success ? parsedKeys.data : {} };
  },
  staleTime: Infinity,
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: ({ children }) => (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <Providers>
        <body className="p-4">
          <main>{children}</main>
          <Scripts />
          <Devtools />
        </body>
      </Providers>
    </html>
  ),
});
