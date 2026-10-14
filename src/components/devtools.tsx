import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

export const Devtools = () => (
	<TanStackDevtools
		plugins={[
			{
				defaultOpen: true,
				name: "TanStack Query",
				render: <ReactQueryDevtoolsPanel />,
			},
			{
				defaultOpen: false,
				name: "TanStack Router",
				render: <TanStackRouterDevtoolsPanel />,
			},
		]}
	/>
);
