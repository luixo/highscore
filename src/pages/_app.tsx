import type { NextPage } from 'next';
import type { AppType, AppProps } from 'next/app';
import { type ReactElement, type ReactNode } from 'react';
import { getCookies } from 'cookies-next';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { DefaultLayout } from '~/components/default-layout';
import { trpc } from '~/utils/trpc';
import '~/styles/globals.css';
import { ModeratorProvider } from '~/components/moderator-context';
import { MODERATOR_COOKIE_NAME } from '~/server/cookie';
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'react-hot-toast';

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps<{
  cookies: Partial<Record<string, string>>;
}> & {
  Component: NextPageWithLayout;
};

const App = (({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);

  return getLayout(<Component {...pageProps} />);
}) as AppType;

const AppWithContext: AppType = (props) => {
  const pageProps = props.pageProps as AppPropsWithLayout['pageProps'];
  const moderatorCookie = pageProps.cookies[MODERATOR_COOKIE_NAME];
  return (
    <ModeratorProvider
      initialEmail={
        moderatorCookie ? decodeURIComponent(moderatorCookie) : undefined
      }
    >
      <NextUIProvider>
        <App {...props} />
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster position="bottom-right" />
      </NextUIProvider>
    </ModeratorProvider>
  );
};

AppWithContext.getInitialProps = async ({ ctx }) => {
  const cookies = await getCookies(ctx);
  const pageProps: AppPropsWithLayout['pageProps'] = {
    cookies: {
      [MODERATOR_COOKIE_NAME]: cookies?.[MODERATOR_COOKIE_NAME],
    },
  };
  return { pageProps };
};

export default trpc.withTRPC(AppWithContext);
