import { BrowserWindow } from "electron";

export type GetMainWindowDelegate = () => BrowserWindow | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SendIpcDelegate = (channel: string, ...args: any[]) => void;
