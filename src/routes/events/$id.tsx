import { createFileRoute } from "@tanstack/react-router";

import { Page } from "~/pages/event";

const Wrapper = () => {
  const { id } = Route.useParams();
  return <Page id={id} />;
};
export const Route = createFileRoute("/events/$id")({
  component: Wrapper,
});
