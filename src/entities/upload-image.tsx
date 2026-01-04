import React from "react";

import { useMutation } from "@tanstack/react-query";
import { doNothing } from "remeda";

import { FileInput } from "~/entities/file-input";
import { useTRPC } from "~/utils/trpc";

export const UploadImage: React.FC<{
  children: (opts: { onPress: () => void }) => void;
  onUpload: (url: string) => void;
}> = ({ onUpload, children }) => {
  const trpc = useTRPC();
  const uploadImageMutation = useMutation(
    trpc.utils.uploadImage.mutationOptions({
      onSuccess: ({ url }) => onUpload(url),
    }),
  );
  const inputClickRef = React.useRef<() => void>(doNothing);
  const onInputButtonClick = React.useEffectEvent(() => {
    inputClickRef.current();
  });
  const onSubmit = React.useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      uploadImageMutation.mutate(formData);
    },
    [uploadImageMutation],
  );
  return (
    <>
      <FileInput
        onFileUpdate={async (file) => onSubmit(file)}
        onClickRef={inputClickRef}
      />
      {children({ onPress: onInputButtonClick })}
    </>
  );
};
