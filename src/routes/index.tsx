import { createFileRoute } from "@tanstack/react-router";

import { Page } from "~/pages/index";

const Wrapper = () => <Page />;
export const Route = createFileRoute("/")({
  component: Wrapper,
});
