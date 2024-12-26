import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { DialogRefService } from '@core/service/dialog';
import { IpcChannels } from '@ipc-consts';
import { Dialog, DialogType } from '@shared/type';
import { IpcRenderer } from 'electron';
import { IpcRendererEvent } from 'electron/main';
import { Observable, Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class BrowserService {
	private readonly electron: IpcRenderer;

	constructor(
		private readonly dialogRef: DialogRefService,
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
		const windowId = this.electron.sendSync(IpcChannels.BrowserOpen, url, external);

		if (!external) {
			const dialog: Dialog = {
				close: () => this.electron.send(IpcChannels.BrowserClose, windowId),
				type: DialogType.Browser,
			};

			this.dialogRef.add(dialog);

			const scopedMinimized = (event: IpcRendererEvent, id: string) => {
				if (id === windowId) {
					this.dialogRef.remove(dialog);
				}
			};

			const scopedRestored = (event: IpcRendererEvent, id: string) => {
				if (id === windowId) {
					this.dialogRef.remove(dialog);
					this.dialogRef.add(dialog);
				}
			};

			this.electron.on(IpcChannels.BrowserMinimized, scopedMinimized);
			this.electron.on(IpcChannels.BrowserRestored, scopedRestored);

			this.electron.once(IpcChannels.BrowserClosed, (event, id: string) => {
				if (id === windowId) {
					this.electron.off(IpcChannels.BrowserMinimized, scopedMinimized);
					this.electron.off(IpcChannels.BrowserRestored, scopedRestored);
					this.dialogRef.remove(dialog);
				}
			});
		}
	}
}
