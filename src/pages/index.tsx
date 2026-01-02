import type React from "react";

import { CreateEventModal } from "~/entities/create-event-modal";
import { Events } from "~/entities/events";
import { useTranslation } from "~/utils/i18n";

export const Page: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
          {t("index.title")}
        </h1>
        <CreateEventModal />
      </div>
      <Events />
    </div>
  );
};
