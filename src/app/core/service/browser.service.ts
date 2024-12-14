import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { IpcRenderer } from 'electron';
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class BrowserService {
	private readonly electron: IpcRenderer;

	constructor(
		electronProvider: ElectronProvider
	) {
		this.electron = electronProvider.provideIpcRenderer();
	}

	public retrieve(url: string): Observable<void> {
		const subject = new Subject<void>();
		this.electron.invoke(IpcChannels.BrowserRetrieve, url).then(() => {
			subject.next();
			subject.complete();
		});
		return subject;
	}

	public openAndWait(url: string, smallerWindow = false): Observable<void> {
		const subject = new Subject<void>();
		this.electron.invoke(IpcChannels.BrowserOpenAndWait, url, smallerWindow).then(() => {
			subject.next();
			subject.complete();
		});
		return subject;
	}

	public open(url: string, external = false): void {
		this.electron.send(IpcChannels.BrowserOpen, url, external);
	}
}
