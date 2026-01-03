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
import { createTRPCClient } from "@trpc/client";

import { Devtools } from "~/components/devtools";
import {
  MODERATOR_COOKIE_KEYS,
  ModeratorProvider,
} from "~/contexts/moderator-context";
import type { AppRouter } from "~/server/routers/_app";
import { moderatorKeysSchema } from "~/server/schemas";
import appCss from "~/styles/app.css?url";
import type { createI18nContext } from "~/utils/i18n";
import { TRPCProvider, links } from "~/utils/trpc";

const RootComponent = () => {
  const { moderatorKeys } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [trpcClient] = React.useState(() =>
    createTRPCClient<AppRouter>({ links }),
  );
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
  cookies: Record<string, string | undefined>;
  queryClient: QueryClient & {
    context: RouterContext;
  };
  i18n: ReturnType<typeof createI18nContext>;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async ({ context }) => {
    const moderatorKeysParseResult = moderatorKeysSchema.safeParse(
      context.cookies[MODERATOR_COOKIE_KEYS]
        ? decodeURIComponent(context.cookies[MODERATOR_COOKIE_KEYS])
        : undefined,
    );
    await context.i18n.loadNamespace("default");
    return {
      title: context.i18n.getTranslation()("common.title"),
      moderatorKeys: moderatorKeysParseResult.success
        ? moderatorKeysParseResult.data
        : {},
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      loaderData ? { title: loaderData.title } : undefined,
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
