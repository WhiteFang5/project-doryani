import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { Point } from '@shared/type';
import { IpcRenderer } from 'electron';

@Injectable({
	providedIn: 'root',
})
export class MouseService {
	private readonly ipcRenderer: IpcRenderer;

	constructor(electronProvider: ElectronProvider) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
	}

	public position(): Point {
		return this.ipcRenderer.sendSync(IpcChannels.GetCursorScreenPoint);
	}
}
