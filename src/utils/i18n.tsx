import type { PropsWithChildren } from "react";

import i18n from "i18next";
import {
  I18nextProvider as I18NextProviderRaw,
  useTranslation as useTranslationRaw,
} from "react-i18next";
import { clone } from "remeda";

import {
  COOKIE_LANGUAGE_NAME,
  getBackendModule,
  getLanguage,
  i18nInitOptions,
} from "~/utils/i18n-internal";
import type { Language, Namespace } from "~/utils/language";
import { DAY } from "~/utils/time";

export const useTranslation = () => {
  const translation = useTranslationRaw();
  return {
    ...translation,
    changeLanguage: (language: Language) => {
      translation.i18n.changeLanguage(language);
      // see https://developer.chrome.com/blog/cookie-max-age-expires?hl=ru
      document.cookie = `${COOKIE_LANGUAGE_NAME}=${language};path=/;max-age=${(DAY * 400) / 1000};samesite=lax`;
    },
    language: translation.i18n.language as Language,
  };
};

/*
  i18n flow

  Server:
  - instance is created on server (with fixed lng & loaded resources)
  - server provides instance via `Provider`
  
  Client:
  - instance lng & resources are dehydrated to client via `serializeContext`
  - client hydrates them via `onHydrate`
  - client provides hydrated instance via `Provider`
*/
export const createI18nContext = () => {
  const initialLanguage = getLanguage();
  const instance = i18n
    // Options are cloned because i18next mutates properties inline
    // causing different request to get same e.g. namespaces
    .createInstance(clone(i18nInitOptions))
    .use(getBackendModule());
  const serializeContext = () => ({
    language: instance.language as Language,
    data: instance.store?.data,
  });
  return {
    serializeContext,
    onHydrate: async (serializedData: ReturnType<typeof serializeContext>) => {
      await instance.init({
        lng: serializedData.language,
        resources: serializedData.data,
      });
    },
    Provider: ({ children }: PropsWithChildren) => (
      <I18NextProviderRaw i18n={instance}>{children}</I18NextProviderRaw>
    ),
    loadNamespace: async (namespace: Namespace) => {
      await instance
        .init({ lng: initialLanguage })
        .then(() => instance.loadNamespaces(namespace));
    },
    getTranslation: () => instance.getFixedT(initialLanguage),
  };
};
