import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "~/server/request";

export const getLanguages = createIsomorphicFn()
	.server(() =>
		(getRequest().headers.get("accept-language") ?? "")
			.split(",")
			.map((lang) => {
				const [tag = "", q = "1"] = lang.trim().split(";q=");
				const [baseTag] = tag.split("-");
				return {
					baseTag: baseTag?.toLowerCase() ?? "",
					fullTag: tag.toLowerCase(),
					q: Number(q),
				};
			})
			.toSorted((a, b) => b.q - a.q)
			.flatMap(({ fullTag, baseTag }) => [fullTag, baseTag]),
	)
	.client(() => window.navigator.languages);
