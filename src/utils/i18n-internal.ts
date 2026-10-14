import { createIsomorphicFn } from "@tanstack/react-start";
import type { BackendModule, InitOptions, ResourceKey } from "i18next";
import { keys } from "remeda";
import { getCookies } from "~/utils/cookies";
import { getLanguages } from "~/utils/headers";
import type { Language, Namespace } from "~/utils/language";
import { baseLanguage, defaultNamespace, languages } from "~/utils/language";

const readIsomorphic = createIsomorphicFn()
	.server(async (language: Language, namespace: Namespace) => {
		/* oxlint-disable import/no-nodejs-modules */
		const fs = await import("node:fs/promises");
		const url = await import("node:url");
		/* oxlint-enable import/no-nodejs-modules */
		const jsonUrl = new url.URL(
			`../../public/locales/${language}/${namespace}.json`,
			import.meta.url,
		);

		const fileContent = await fs.readFile(url.fileURLToPath(jsonUrl));
		const resource = JSON.parse(fileContent.toString("utf8")) as ResourceKey;
		return resource;
	})
	.client(async (language: Language, namespace: Namespace) => {
		const response = await fetch(`/locales/${language}/${namespace}.json`);
		return response.json() as Promise<ResourceKey>;
	});

export const getBackendModule = (): BackendModule => ({
	init: () => {
		/* empty */
	},
	// This is a bug in i18n
	// oxlint-disable-next-line typescript/strict-void-return typescript/no-misused-promises
	read: async (language, namespace) => {
		try {
			return await readIsomorphic(language as Language, namespace as Namespace);
		} catch (error) {
			// oxlint-disable-next-line no-console
			console.error(`Failed to load ${language}/${namespace} i18n translation`);
			throw error;
		}
	},
	type: "backend",
});

export const COOKIE_LANGUAGE_NAME = "LANGUAGE";

const isLanguage = (input: string): input is Language =>
	keys(languages).includes(input as Language);

type Strategy = "cookie" | "header" | "baseLocale";
const strategies: Strategy[] = ["cookie", "header", "baseLocale"];
export const getLanguage = async () => {
	for (const strategy of strategies) {
		switch (strategy) {
			case "cookie": {
				const cookies = await getCookies();
				const cookieLanguage = cookies[COOKIE_LANGUAGE_NAME] ?? "";
				if (isLanguage(cookieLanguage)) {
					return cookieLanguage;
				}
				break;
			}
			case "header": {
				const headerLanguages = getLanguages();
				for (const headerLanguage of headerLanguages) {
					if (isLanguage(headerLanguage)) {
						return headerLanguage;
					}
				}
				break;
			}
			case "baseLocale": {
				return baseLanguage;
			}
		}
	}
	return baseLanguage;
};

export const i18nInitOptions: InitOptions = {
	defaultNS: defaultNamespace,
	fallbackLng: baseLanguage,
	interpolation: {
		// React doesn't need to escape values
		escapeValue: false,
	},
	ns: [defaultNamespace],
	partialBundledLanguages: true,
	postProcess: "capitalize",
	supportedLngs: keys(languages),
};
