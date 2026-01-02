import type { AssertAllEqual } from "~/types/utils";

import type defaultEn from "../../public/locales/en/default.json";
import type defaultRu from "../../public/locales/ru/default.json";

// To add a language add code in the list, namespace jsons, import at (*) and verification at (**)
export type Language = "en" | "ru";
export const baseLanguage = "en";
export const languages: Record<Language, true> = {
  en: true,
  ru: true,
};

// To add a namespace add name in the list, namespace json, import at (*) and verification at (**)
export type Namespace = "default";
export const defaultNamespace: Namespace = "default";
export const namespaces: Record<Namespace, true> = {
  default: true,
};

export type Resources = {
  default: typeof defaultEn;
};

type ValidatedResources = AssertAllEqual<
  [
    Resources,
    {
      default: typeof defaultRu;
    },
  ]
>;

declare module "i18next" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CustomTypeOptions {
    defaultNS: "default";
    resources: ValidatedResources extends never ? never : Resources;
  }
}
