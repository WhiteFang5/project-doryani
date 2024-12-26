import { BrowserWindow, IpcMain, Shell } from 'electron';
import { APP_CONFIG } from '../src/environments/environment';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';
import { GetMainWindowDelegate, SendIpcDelegate } from './types';

const children: Record<string, BrowserWindow | null> = {};

export function register(ipcMain: IpcMain, shell: Shell, getMainWindow: GetMainWindowDelegate, send: SendIpcDelegate): void {
	ipcMain.handle(IpcChannels.BrowserRetrieve, (event, url: string) => {
		return new Promise((resolve) => {
			const parent = getMainWindow() || undefined;
			const win = new BrowserWindow({
				parent,
				show: false,
			});
			setupCookieSharing(win);
			win.webContents.once('did-finish-load', () => {
				resolve(true);
				win.close();
			});
			win.loadURL(url);
		});
	});

	ipcMain.handle(IpcChannels.BrowserOpenAndWait, (event, url: string, smallerWindow: boolean) => {
		return new Promise((resolve, reject) => {
			const parent = getMainWindow();
			if (!parent) {
				reject();
				return;
			}
			const [width, height] = parent.getSize();
			const win = new BrowserWindow({
				parent,
				center: true,
				autoHideMenuBar: true,
				width: smallerWindow ? Math.round(Math.min(height * 1.3, width * 0.7)) : width,
				height: smallerWindow ? Math.round(height * 0.7) : height,
				backgroundColor: '#0F0F0F',
				show: false,
			});
			setupCookieSharing(win);
			parent.setEnabled(false);
			win.once('closed', () => {
				parent.setEnabled(true);
				parent.moveTop();
				resolve(true);
			});
			win.once('ready-to-show', () => {
				win.webContents.zoomFactor = parent.webContents.zoomFactor;
				win.show();
			});
			win.loadURL(url);
		});
	});

	ipcMain.on(IpcChannels.BrowserClose, (event, id: string) => {
		children[id]?.close();
	});

	ipcMain.on(IpcChannels.BrowserOpen, (event, url: string, external: boolean) => {
		if (external) {
			shell.openExternal(url);

			event.returnValue = true;
		} else {
			const parent = getMainWindow();
			if (!parent) {
				shell.openExternal(url);
				return;
			}
			const [width, height] = parent.getSize();

			const id = Date.now().toString(16);

			const win = new BrowserWindow({
				center: true,
				parent,
				autoHideMenuBar: true,
				width: Math.round(Math.min(height * 1.3, width * 0.7)),
				height: Math.round(height * 0.7),
				backgroundColor: url.startsWith('file://') ? '#FCFCFC' : '#0F0F0F',
				show: false,
			});
			children[id] = win;

			setupCookieSharing(win);
			parent.setEnabled(false);
			win.on('minimize', () => {
				parent.setEnabled(true);
				send(IpcChannels.BrowserMinimized, id);
			});
			const restore = () => {
				parent.setEnabled(false);
				send(IpcChannels.BrowserRestored, id);
			};
			win.on('restore', () => restore());
			win.on('maximize', () => restore());
			win.once('closed', () => {
				children[id] = null;
				parent.setEnabled(true);
				parent.moveTop();
				send(IpcChannels.BrowserClosed, id);
			});
			win.once('ready-to-show', () => {
				win.webContents.zoomFactor = parent.webContents.zoomFactor;
				win.show();
			});
			win.loadURL(url);

			event.returnValue = id;
		}
	});
}

export function setupCookieSharing(browserWindow: BrowserWindow) {
	browserWindow.webContents.session.webRequest.onHeadersReceived({
		urls: APP_CONFIG.cookieSharingUrls
	}, (details, next) => {
		if (!details.responseHeaders) {
			return;
		}
		const cookies = details.responseHeaders['set-cookie'];
		details.responseHeaders!['set-cookie'] = cookies.map(cookie => {
			cookie = cookie
				.split(';')
				.map(x => x.trim())
				.filter(x =>
					!x.toLowerCase().startsWith('samesite') &&
					!x.toLowerCase().startsWith('secure'))
				.join('; ');

			return `${cookie}; SameSite=None; Secure`;
		});
		next({ responseHeaders: details.responseHeaders });
	});
}
