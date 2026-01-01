import { createIsomorphicFn } from "@tanstack/react-start";
import { parse } from "cookie";

import { getRequest } from "~/server/request";

export const getCookies = createIsomorphicFn()
  .server(() => parse(getRequest().headers.get("cookie") || ""))
  .client(() => parse(document.cookie));
