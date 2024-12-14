import { Injectable } from '@angular/core';
import { ElectronProvider } from '@core/provider/electron.provider';
import { APP_CONFIG } from '@env/environment';
import { IpcChannels } from '@ipc-consts';
import { IpcRenderer } from 'electron';

interface LogTags {
	cacheService?: boolean;
	rateLimiter?: boolean;
	poeHttp?: boolean;
	electronService?: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class LoggerService {
	private readonly enabledLogTags: LogTags = {
		poeHttp: true,
		cacheService: false,
		rateLimiter: false,
		electronService: true,
	};

	private readonly ipcRenderer: IpcRenderer;

	constructor(electronProvider: ElectronProvider) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
	}

	public isLogTagEnabled(tag: string): boolean {
		return tag.length === 0 || this.enabledLogTags[tag as keyof LogTags] || false;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public debug(tag: string, message: string, ...args: any[]): void {
		this.sendLog('debug', tag, message, ...args);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public log(tag: string, message: string, ...args: any[]): void {
		this.sendLog('log', tag, message, ...args);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public info(message: string, ...args: any[]): void {
		this.sendLog('info', '', message, ...args);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public warn(message: string, ...args: any[]): void {
		this.sendLog('warn', '', message, ...args);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public error(message: string, ...args: any[]): void {
		this.sendLog('error', '', message, ...args);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private sendLog(level: string, tag: string, message: string, ...args: any[]): void {
		if (tag.length > 0) {
			if (!this.enabledLogTags[tag as keyof LogTags]) {
				return;
			}
			message = `[${tag}] ${message}`;
		}
		if (APP_CONFIG.production) {
			this.ipcRenderer?.sendSync(IpcChannels.Log, level, message, ...args);
		} else {
			console.log(message);
			args.forEach(arg => console.log(arg));
		}
	}
}
