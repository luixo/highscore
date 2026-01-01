import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest as getRequestRaw } from "@tanstack/react-start/server";

export const getRequest = createServerOnlyFn(getRequestRaw);
