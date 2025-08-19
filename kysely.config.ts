import { defineConfig } from "kysely-ctl";

import { getDatabase } from "./src/server/database/database";

export default defineConfig({
  kysely: getDatabase(),
  migrations: {
    migrationFolder: "src/server/database/migrations",
  },
});
