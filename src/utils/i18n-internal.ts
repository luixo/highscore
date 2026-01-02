import type { BackendModule, InitOptions, ResourceKey } from "i18next";
import { keys } from "remeda";

import { getCookies } from "~/utils/cookies";
import { getLanguages } from "~/utils/headers";
import type { Language } from "~/utils/language";
import { baseLanguage, defaultNamespace, languages } from "~/utils/language";

export const getBackendModule = (): BackendModule => ({
  type: "backend",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init: () => {},
  read: async (language, namespace) => {
    try {
      if (import.meta.env.SSR) {
        const fs = await import("node:fs/promises");
        const url = await import("node:url");
        const jsonUrl = new url.URL(
          `../../public/locales/${language}/${namespace}.json`,
          import.meta.url,
        );

        const fileContent = await fs.readFile(url.fileURLToPath(jsonUrl));
        const resource = JSON.parse(fileContent.toString("utf8"));
        return resource as ResourceKey;
      }
      const response = await fetch(`/locales/${language}/${namespace}.json`);
      return await (response.json() as Promise<ResourceKey>);
    } catch (e) {
      console.error(`Failed to load ${language}/${namespace} i18n translation`);
      throw e;
    }
  },
});

export const COOKIE_LANGUAGE_NAME = "LANGUAGE";

const isLanguage = (input: string): input is Language =>
  keys(languages).includes(input as Language);

type Strategy = "cookie" | "header" | "baseLocale";
const strategies: Strategy[] = ["cookie", "header", "baseLocale"];
export const getLanguage = () => {
  for (const strategy of strategies) {
    switch (strategy) {
      case "cookie": {
        const cookies = getCookies();
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
  fallbackLng: baseLanguage,
  defaultNS: defaultNamespace,
  ns: [defaultNamespace],
  supportedLngs: keys(languages),
  interpolation: {
    // React doesn't need to escape values
    escapeValue: false,
  },
  postProcess: "capitalize",
  partialBundledLanguages: true,
};
