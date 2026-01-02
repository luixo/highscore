import { Link } from "@tanstack/react-router";

import { useTranslation } from "~/utils/i18n";

export const NotFound: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <Link to="/" className="text-gray-300 underline">
        {t("notFound.home")}
      </Link>
      <div className="flex flex-col">
        <h1 className="text-9xl font-bold">404</h1>
        <h2 className="text-4xl font-bold">{t("notFound.message")}</h2>
      </div>
    </div>
  );
};
