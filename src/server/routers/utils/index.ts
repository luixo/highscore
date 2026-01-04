import { router as trpcRouter } from "~/server/router";

import { procedure as uploadImageProcedure } from "./upload-image";

export const router = trpcRouter({
  uploadImage: uploadImageProcedure,
});
