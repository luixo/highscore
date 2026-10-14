import React from "react";

const subscribe = () => () => {
	// The client/server snapshot never changes, so there is nothing to unsubscribe.
};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export const useMounted = () =>
	React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
