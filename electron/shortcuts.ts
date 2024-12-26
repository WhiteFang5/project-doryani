import {
    GlobalShortcut,
    IpcMain,
} from 'electron';
import { SendIpcDelegate } from 'electron/types';
import { UiohookKey, uIOhook } from 'uiohook-napi';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';

type UiohookKeyT = keyof typeof UiohookKey;

export function register(globalShortcut: GlobalShortcut, ipcMain: IpcMain, send: SendIpcDelegate): void {
	ipcMain.on(IpcChannels.RegisterShortcut, (event, accelerator) => {
		globalShortcut.register(accelerator, () => {
			send(`${IpcChannels.ShortcutPrefix}${accelerator}`);
		});
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.UnregisterShortcut, (event, accelerator) => {
		globalShortcut.unregister(accelerator);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.KeyTap, (event, key: unknown, modifiers: unknown[]) => {
		if (!isValidKey(key) || !modifiers.every(isValidKey)) {
			event.returnValue = false;
			return;
		}
		uIOhook.keyTap(getKeyCode(key), modifiers.length == 0 ? undefined : modifiers.map(getKeyCode));
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.KeyToggle, (event, key: string, down: boolean) => {
		if (!isValidKey(key)) {
			event.returnValue = false;
			return;
		}
		uIOhook.keyToggle(getKeyCode(key), down ? 'down' : 'up');
		event.returnValue = true;
	});
}

function getKeyCode(key: unknown): number {
	if (typeof key === 'number') {
		return key;
	} else {
		return UiohookKey[key as UiohookKeyT];
	}
}

function isValidKey(key: unknown): boolean {
	if (!Object.entries(UiohookKey).some(([, v]) => v === key) && !Object.getOwnPropertyNames(UiohookKey).some((p) => p === key)) {
		console.warn(`Key '${key}' is not supported.`);
		return false;
	}
	return true;
}
