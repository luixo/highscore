import { createIsomorphicFn } from "@tanstack/react-start";

export const getUuid = createIsomorphicFn()
	.server(() => "none")
	.client(() => window.crypto.randomUUID());
