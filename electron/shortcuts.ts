import {
	GlobalShortcut,
	IpcMain,
} from 'electron';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';
import { SendIpcDelegate } from 'electron/types';

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
}
