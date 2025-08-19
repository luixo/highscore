import type React from "react";

import { CreateEventModal } from "~/entities/create-event-modal";
import { Events } from "~/entities/events";

export const Page: React.FC = () => (
  <div className="flex flex-col gap-8">
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-[clamp(1rem,10vw,2rem)] font-semibold tracking-tight sm:text-[clamp(1rem,10vw,3rem)] lg:text-5xl">
        Список игр
      </h1>
      <CreateEventModal />
    </div>
    <Events />
  </div>
);
