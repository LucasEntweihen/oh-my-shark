import type { OmpApi } from "../shared/ipc-types";

declare global {
	interface Window {
		omsk: OmpApi;
	}
}
