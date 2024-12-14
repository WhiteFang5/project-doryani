/* eslint-disable @typescript-eslint/no-require-imports */
import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions, Rectangle, screen, session, shell, Tray } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';
import * as browserEvents from './browser-events';
import * as game from './game';
import * as ipcEvents from './ipc-events';
import { WindowEventForwarder } from './ipc-events';
import * as log from './log';
import { State } from './state';

if (!app.requestSingleInstanceLock()) {
	app.exit();
}

log.register(ipcMain);

console.info('App starting...');

const state = new State(app.getPath('userData'));
if (!state.hardwareAcceleration) {
	app.disableHardwareAcceleration();

	console.info('App started with disabled hardware acceleration.');
}

const args = process.argv.slice(1);
console.info('App args', args);

const serve = args.some((val) => val === '--serve');
const debug = args.some((val) => val === '--dev');

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let menu: Menu | null = null;
const winEventForwarder = new WindowEventForwarder();
const children: Record<string, BrowserChild | null> = {};

interface BrowserChild {
	window: BrowserWindow;
	closeByCommand: boolean;
	hasRequestedClose: boolean;
}

/* Register Listeners */
ipcEvents.register(app, ipcMain, screen, getWindow);
browserEvents.register(ipcMain, shell, getWindow);
game.register(serve, ipcMain, getWindow, send);

/* Main Window */
function createWindow(): BrowserWindow {
	const bounds = getBounds();

	console.info(`Creating window with size ${bounds.width}x${bounds.height}`);

	// Create the browser window.
	win = new BrowserWindow({
		width: bounds.width,
		height: bounds.height,
		x: bounds.x,
		y: bounds.y,
		enableLargerThanScreen: true,
		transparent: true,
		frame: false,
		resizable: false,
		movable: false,
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: serve,
			webSecurity: false,
			contextIsolation: false,
		},
		focusable: process.platform !== 'linux' ? false : true,
		skipTaskbar: true,
		show: false,
	});
	win.setSize(bounds.width, bounds.height);   // Explicitly set size after creating the window since some OS'es don't allow an initial size larger than the display's size.
	//win.removeMenu();
	win.setIgnoreMouseEvents(true, { forward: true });

	if (process.platform !== 'linux') {
		win.setAlwaysOnTop(true, 'pop-up-menu', 1);
	} else {
		win.setAlwaysOnTop(true);
	}

	win.setVisibleOnAllWorkspaces(true);

	loadApp(win);

	win.on('closed', () => {
		winEventForwarder.unregister();
		win = null;
	});

	if (serve) {
		// Electron bug workaround: this must be triggered after the devtools loaded
		win.setIgnoreMouseEvents(true, { forward: true });
	}

	winEventForwarder.register(win);

	return win;
}

function loadApp(self: BrowserWindow, route = ''): void {
	console.info(`Opening route: ${route}`);
	if (serve) {
		require('electron-reloader')(module);
		self.loadURL('http://localhost:4200' + route);
		self.webContents.openDevTools({ mode: 'undocked' });
	} else {
		const appUrl = url.format({
			pathname: path.join(__dirname, 'dist/index.html'),
			protocol: 'file:',
			slashes: true,
		});
		self.loadURL(appUrl + route);
	}
}

/* Modal Window */

ipcMain.handle(IpcChannels.OpenRoute, (event, route: string, closeByCommand: boolean) => {
	return new Promise<void>((resolve, reject) => {
		try {
			const isThread = route.endsWith('-thread');
			if (!children[route]) {
				const child: BrowserChild = {
					window: new BrowserWindow({
						width: 1210,
						height: 700,
						frame: !isThread,
						resizable: true,
						movable: true,
						webPreferences: {
							nodeIntegration: true,
							allowRunningInsecureContent: serve,
							webSecurity: false,
							contextIsolation: false,
						},
						center: true,
						transparent: true,
						show: !isThread,
						skipTaskbar: isThread,
						focusable: !isThread,
						closable: !isThread,
					}),
					closeByCommand: closeByCommand,
					hasRequestedClose: false,
				};
				children[route] = child;

				child.window.removeMenu();

				child.window.on('close', (event) => {
					if (!child.closeByCommand || child.hasRequestedClose) {
						return;
					}
					ipcMain.once(IpcChannels.WindowCloseReq, (event, close: boolean) => {
						if (close) {
							child.hasRequestedClose = true;
							child.window.close();
						}
					});
					child.window.webContents.send(IpcChannels.WindowCloseReq);
					event.preventDefault();
				});

				child.window.once('closed', () => {
					children[route] = null;
					win?.moveTop();
					resolve();
				});

				loadApp(child.window, `#/${route}`);
			} else if (!isThread) {
				const child = children[route]!;
				if (child.window.isMinimized()) {
					child.window.restore();
				}
				child.window.show();
			}
		} catch (error) {
			reject(error);
		}
	});
});

/* Tray */

function createTray(): Tray {
	const iconFile = /^win/.test(process.platform) ? 'favicon.ico' : 'favicon.png';
	const iconPath = serve ? `./src/${iconFile}` : path.join(__dirname, 'dist', iconFile);
	tray = new Tray(iconPath);

	const items: MenuItemConstructorOptions[] = [
		{
			label: 'Settings',
			type: 'normal',
			click: () => send(IpcChannels.ShowUserSettings),
		},
		{
			label: 'Reset Zoom',
			type: 'normal',
			click: () => send(IpcChannels.ResetZoom),
		},
		{
			label: 'Relaunch',
			type: 'normal',
			click: () => send(IpcChannels.AppRelaunch),
		},
		{
			label: 'Hardware Acceleration',
			type: 'checkbox',
			checked: state.hardwareAcceleration,
			click: () => {
				state.hardwareAcceleration = !state.hardwareAcceleration;
				send(IpcChannels.AppRelaunch);
			},
		},
		/*{
			label: 'Changelog',
			type: 'normal',
			click: () => showChangelog(),
		},*/
		{
			label: 'Exit',
			type: 'normal',
			click: () => send(IpcChannels.AppQuit),
		},
	];

	if (serve) {
		items.splice(1, 0, {
			label: 'Ignore Mouse Events',
			type: 'normal',
			click: () => win?.setIgnoreMouseEvents(true),
		});
	}
	if (debug || serve) {
		items.splice(1, 0, {
			label: 'Open Dev Tools',
			type: 'normal',
			click: () => {
				if (!win) {
					console.warn('No main window found');
					return;
				}
				if (win.webContents.isDevToolsOpened()) {
					win.webContents.closeDevTools();
					for (const child in children) {
						children[child]?.window.webContents.closeDevTools();
					}
				} else {
					win.webContents.openDevTools({ mode: 'undocked' });
					for (const child in children) {
						children[child]?.window.webContents.openDevTools({ mode: 'undocked' });
					}

					// Electron bug workaround: this must be triggered after the devtools loaded
					win.setIgnoreMouseEvents(true, { forward: true });
				}
			},
		});
	}

	menu = Menu.buildFromTemplate(items);
	tray.setToolTip(`Project Doryani: ${app.getVersion()}`);
	tray.setContextMenu(menu);
	tray.on('double-click', () => send(IpcChannels.ShowUserSettings));
	return tray;
}

/* Helper Methods */
function getBounds(): Rectangle {
	const displays = screen.getAllDisplays();
	const primary = screen.getPrimaryDisplay();
	const bounds = {
		x: primary.bounds.x,
		y: primary.bounds.y,
		width: primary.bounds.width,
		height: primary.bounds.height,
	};
	displays.forEach((display) => {
		if (display.id !== primary.id) {
			if (bounds.x !== display.bounds.x) {
				bounds.x = Math.min(bounds.x, display.bounds.x);
				bounds.width += display.bounds.width;
			}
			if (bounds.y !== display.bounds.y) {
				bounds.y = Math.min(bounds.y, display.bounds.y);
				bounds.height += display.bounds.height;
			}
		}
	});
	return bounds;
}

function getWindow(): BrowserWindow | null {
	return win;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function send(channel: string, ...args: any[]): void {
	try {
		if (win === null) {
			throw new Error('Main window not found.');
		}
		win.webContents.send(channel, ...args);
	} catch (error) {
		console.error(`could not send to '${channel}' with args '${JSON.stringify(args)}. Error: ${error}`);
	}
}

function setUserAgent(): void {
	const generatedUserAgent = `PoEOverlayCommunityFork-project-doryani/${app.getVersion()} (contact: p.overlay.c.f@gmail.com)`;
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		details.requestHeaders['User-Agent'] = generatedUserAgent;
		callback({ cancel: false, requestHeaders: details.requestHeaders });
	});
}

/* Start the App */
try {
	app.on('ready', () => {
		/* delay create window in order to support transparent windows at linux. */
		setTimeout(() => {
			createWindow();
			createTray();
		}, 300);
		setUserAgent();
	});

	app.on('window-all-closed', () => {
		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});

	app.on('activate', () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (win === null) {
			createWindow();
		}
	});
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
	// Catch Error
	//throw e;
}
