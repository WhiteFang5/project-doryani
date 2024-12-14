import { Injectable, NgZone } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { AppUpdateState, VisibleFlag } from '@shared/type/app.type';
import { IpcRenderer } from 'electron';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class AppService {
	private readonly ipcRenderer: IpcRenderer;

	private readonly activeChange$ = new BehaviorSubject<boolean>(false);
	private readonly focusChange$ = new BehaviorSubject<boolean>(false);

	private readonly updateState$ = new BehaviorSubject<AppUpdateState>(AppUpdateState.None);

	constructor(
		private readonly ngZone: NgZone,
		electronProvider: ElectronProvider
	) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
	}

	public registerEvents(autoDownload: boolean): void {
		this.ipcRenderer.on(IpcChannels.AppUpdateAvailable, () => {
			this.ngZone.run(() => this.updateState$.next(AppUpdateState.Available));
		});
		this.ipcRenderer.on(IpcChannels.AppUpdateDownloaded, () => {
			this.ngZone.run(() => this.updateState$.next(AppUpdateState.Downloaded));
		});
		this.ipcRenderer.on(IpcChannels.AppRelaunch, () => {
			this.ngZone.run(() => this.quit(true));
		});
		this.ipcRenderer.on(IpcChannels.AppQuit, () => {
			this.ngZone.run(() => this.quit(false));
		});
		//TODO
		//this.ipcRenderer.sendSync(IpcChannels.AppDownloadInit, autoDownload);
	}

	public updateAutoDownload(autoDownload: boolean): void {
		this.ipcRenderer.sendSync(IpcChannels.AppDownloadAuto, autoDownload);
	}

	public updateStateChange(): Observable<AppUpdateState> {
		return this.updateState$;
	}

	public visibleChange(): Observable<VisibleFlag> {
		console.log('visibleChange');
		this.ipcRenderer.on(IpcChannels.GameActiveChange, (_, arg) => {
			console.log('activeChangedEvent');
			this.ngZone.run(() => this.activeChange$.next(arg));
		});
		this.ipcRenderer.sendSync(IpcChannels.GameSendActiveChange);

		this.ipcRenderer.on(IpcChannels.WindowFocus, () => this.ngZone.run(() => this.focusChange$.next(true)));
		this.ipcRenderer.on(IpcChannels.WindowBlur, () => this.ngZone.run(() => this.focusChange$.next(false)));

		return combineLatest([
			this.activeChange$,
			this.focusChange$,
		]).pipe(
			map(([game, focus]) => {
				let result = VisibleFlag.None;
				if (game) {
					result |= VisibleFlag.Game;
				}
				if (focus) {
					result |= VisibleFlag.Overlay;
				}
				return result;
			})
		);
	}

	public isAutoLaunchEnabled(): Observable<boolean> {
		const subject = new Subject<boolean>();
		this.ipcRenderer.once(IpcChannels.AppAutoLaunchEnabledResult, (_, enabled) => {
			this.ngZone.run(() => {
				subject.next(enabled);
				subject.complete();
			});
		});
		this.ipcRenderer.send(IpcChannels.AppAutoLaunchEnabled);
		return subject;
	}

	public updateAutoLaunchEnabled(enabled: boolean): Observable<boolean> {
		const subject = new Subject<boolean>();
		this.ipcRenderer.once(IpcChannels.AppAutoLaunchChangeResult, (_, success) => {
			this.ngZone.run(() => {
				subject.next(success);
				subject.complete();
			});
		});
		this.ipcRenderer.send(IpcChannels.AppAutoLaunchChange, enabled);
		return subject;
	}

	public triggerVisibleChange(): void {
		this.activeChange$.next(this.activeChange$.value);
	}

	public version(): string {
		return this.ipcRenderer.sendSync(IpcChannels.AppVersion);
	}

	public quit(relaunch: boolean): void {
		if (this.updateState$.value === AppUpdateState.Downloaded) {
			this.ipcRenderer.send(IpcChannels.AppQuitAndInstall, relaunch);
		} else {
			this.ipcRenderer.send(IpcChannels.AppQuit, relaunch);
		}
	}
}
