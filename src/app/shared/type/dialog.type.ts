import { Point } from "@shared/type";

export interface DialogSettings {
	width: number;
	height: number;
	position?: Point;
}

export type DialogCloseFn = () => void;

export enum DialogType {
	None = 0,
	Dialog = 1,
	Browser = 2,
}

export interface Dialog {
	close: DialogCloseFn;
	type: DialogType;
}
