import { IpcMain } from 'electron';
import * as log from 'electron-log';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';

export function register(ipcMain: IpcMain): void {
	ipcMain.on(IpcChannels.Log, (event, level, message, ...args) => {
		log[level as keyof log.LogFunctions](`[project-doryani] ${message}`, ...args);
		event.returnValue = true;
	});

	log.transports.file.level = 'info';
	Object.assign(console, log.functions);
}
