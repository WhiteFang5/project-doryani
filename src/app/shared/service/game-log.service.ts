import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';

@Injectable({
	providedIn: 'root',
})
export class GameLogService {
	public readonly logLineAdded = new EventEmitter<string>(true);

	constructor(
		electronProvider: ElectronProvider,
		ngZone: NgZone
	) {
		const ipcRenderer = electronProvider.provideIpcRenderer();
		ipcRenderer.on(IpcChannels.GameLogLine, (_, logLine: string) => {
			ngZone.run(() => this.logLineAdded.emit(logLine));
		});
	}

	public once(predicate: (logLine: string) => boolean, callback: (logLine: string) => void): void {
		const subscription = this.logLineAdded.subscribe((logLine) => {
			if (predicate(logLine)) {
				callback(logLine);
				subscription.unsubscribe();
			}
		});
	}
}
