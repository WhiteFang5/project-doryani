import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { IpcRenderer } from 'electron/renderer';

@Injectable({
	providedIn: 'root',
})
export class ClipboardService {
	private readonly electron: IpcRenderer;

	constructor(
		electronProvider: ElectronProvider
	) {
		this.electron = electronProvider.provideIpcRenderer();
	}

	public readText(): string {
		return this.electron.sendSync(IpcChannels.GetClipboard);
	}

	public writeText(text: string): void {
		return this.electron.sendSync(IpcChannels.SetClipboard, text);
	}
}
