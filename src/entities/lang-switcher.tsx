import React from "react";

import { Button } from "@heroui/react";
import { keys } from "remeda";

import { useTranslation } from "~/utils/i18n";
import { type Language, languages } from "~/utils/language";

const FLAGS: Record<Language, string> = {
  ru: "RU",
  en: "GB",
};

export const LangSwitcher = () => {
  const { t, language: currentLanguage } = useTranslation();
  const { changeLanguage } = useTranslation();
  const displayNames = React.useMemo(
    () => new Intl.DisplayNames([currentLanguage], { type: "language" }),
    [currentLanguage],
  );
  return (
    <div className="flex flex-col gap-1">
      <h4>{t("settings.langSwitcher.title")}</h4>
      <div className="flex gap-2">
        {keys(languages).map((language) => (
          <Button
            key={language}
            startContent={
              <img
                className="aspect-[2/3] w-5 shrink-0"
                alt={displayNames.of(language)}
                src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${FLAGS[language]}.svg`}
              />
            }
            isDisabled={language === currentLanguage}
            onPress={() => {
              changeLanguage(language);
            }}
          >
            {displayNames.of(language)}
          </Button>
        ))}
      </div>
    </div>
  );
};
