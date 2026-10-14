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
	const inputClickRef = React.useRef<() => void>(doNothing());
	const onInputButtonClick = React.useEffectEvent(() => {
		inputClickRef.current();
	});
	const onSubmit = React.useCallback(
		(file: File) => {
			const formData = new FormData();
			formData.append("image", file);
			uploadImageMutation.mutate(formData);
		},
		[uploadImageMutation],
	);
	return (
		<>
			<FileInput onFileUpdate={onSubmit} onClickRef={inputClickRef} />
			{/* This render prop passes the handler to a button; it does not invoke it during render. */}
			{/* oxlint-disable-next-line react/rule-suppression */}
			{/* oxlint-disable-next-line react-hooks/rules-of-hooks */}
			{children({ onPress: onInputButtonClick })}
		</>
	);
};
