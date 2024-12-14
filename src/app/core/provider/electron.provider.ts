import { Injectable } from '@angular/core';
import { IpcMain, IpcRenderer } from 'electron';

type Electron = typeof Electron;

@Injectable({
	providedIn: 'root',
})
export class ElectronProvider {
	private readonly electron: Electron;

	constructor() {
		if (window?.require) {
			this.electron = window.require('electron') as Electron;
		} else {
			throw new TypeError('window.require not defined.');
		}
	}

	public provideIpcRenderer(): IpcRenderer {
		return this.electron.ipcRenderer;
	}

	public provideIpcMain(): IpcMain {
		return this.electron.ipcMain;
	}
}
