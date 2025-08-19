import { parse } from "cookie";

export const getCookie = (
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined => parse(cookieHeader ?? "")[cookieName];
