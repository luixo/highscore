import type { PropsWithChildren } from "react";
import { createInstance } from "i18next";
import {
	I18nextProvider as I18NextProviderRaw,
	useTranslation as useTranslationRaw,
} from "react-i18next";
import { clone } from "remeda";
import {
	COOKIE_LANGUAGE_NAME,
	getBackendModule,
	i18nInitOptions,
} from "~/utils/i18n-internal";
import type { Language, Namespace } from "~/utils/language";
import { DAY } from "~/utils/time";

export const useTranslation = () => {
	const translation = useTranslationRaw();
	return {
		changeLanguage: async (language: Language) => {
			await translation.i18n.changeLanguage(language);
			// see https://developer.chrome.com/blog/cookie-max-age-expires?hl=ru
			await cookieStore.set({
				expires: Date.now() + DAY * 400,
				name: COOKIE_LANGUAGE_NAME,
				path: "/",
				sameSite: "lax",
				value: language,
			});
		},
		i18n: translation.i18n,
		language: translation.i18n.language as Language,
		ready: translation.ready,
		t: translation.t,
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
export const createI18nContext = (initialLanguage: Language) => {
	// Options are cloned because i18next mutates properties inline
	// causing different request to get same e.g. namespaces
	const instance = createInstance(clone(i18nInitOptions)).use(
		getBackendModule(),
	);
	const serializeContext = () => ({
		data: instance.store.data,
		language: instance.language as Language,
	});
	return {
		Provider: ({ children }: PropsWithChildren) => (
			<I18NextProviderRaw i18n={instance}>{children}</I18NextProviderRaw>
		),
		getTranslation: () => instance.getFixedT(initialLanguage),
		loadNamespace: async (namespace: Namespace) => {
			await instance
				.init({ lng: initialLanguage })
				.then(() => instance.loadNamespaces(namespace));
		},
		onHydrate: async (serializedData: ReturnType<typeof serializeContext>) => {
			await instance.init({
				lng: serializedData.language,
				resources: serializedData.data,
			});
		},
		serializeContext,
	};
};
