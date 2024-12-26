import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { KeyCodeT } from '@shared/type';
import { IpcRenderer } from 'electron';

@Injectable({
	providedIn: 'root',
})
export class KeyboardService {
	private readonly ipcRenderer: IpcRenderer;

	private keyboardDelay = 15;

	private actionCount = 0;

	constructor(
		electronProvider: ElectronProvider
	) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
	}

	public setKeyboardDelay(delay: number) {
		this.keyboardDelay = delay;
	}

	public keyTap(code: KeyCodeT, modifiers: KeyCodeT[] = []): void {
		setTimeout(() => {
			this.actionCount--;
			this.ipcRenderer.sendSync(IpcChannels.KeyTap, code, modifiers);
		}, this.actionCount * this.keyboardDelay);
		this.actionCount++;
	}

	public keyToggle(code: KeyCodeT, down: boolean): void {
		setTimeout(() => {
			this.actionCount--;
			this.ipcRenderer.sendSync(IpcChannels.KeyToggle, code, down);
		}, this.actionCount * this.keyboardDelay);
		this.actionCount++;
	}
}
