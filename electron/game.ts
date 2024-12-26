import { IpcMain, Rectangle } from 'electron';
import { GetMainWindowDelegate, SendIpcDelegate } from 'electron/types';
import * as path from 'path';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';
import { GameLogListener, OnLogLineAddedFunc } from './game-log-listener';
import { Window, getActiveWindow } from './window';

const POE_NAMES = [
	// Epic Games Store
	'pathofexile_x64egs.exe',
	'pathofexileegs.exe',
	'pathofexile_x64egs',
	'pathofexileegs',

	// Steam
	'pathofexile_x64steam.exe',
	'pathofexilesteam.exe',
	'pathofexile_x64steam',
	'pathofexilesteam',

	// Standalone
	'pathofexile_x64.exe',
	'pathofexile.exe',
	'pathofexile_x64',
	'pathofexile',

	// Linux
	'wine64-preloader',
];

const POE_KOREAN_NAMES = [
	// Kakao Client (Korean)
	'pathofexile_x64_kg.exe',
	'pathofexile_kg.exe',
	'pathofexile_x64_kg',
	'pathofexile_kg',
];

const POE_TITLES = ['Path of Exile 2'];

const POE_ALTERNATIVE_TITLES = ['Path of Exile 2 <---> '];

export class Game {
	private window: Window | undefined;
	private gameLogListener: GameLogListener;

	public active?: boolean;
	public bounds?: Rectangle;

	constructor(onLogLineAdded: OnLogLineAddedFunc) {
		this.gameLogListener = new GameLogListener(onLogLineAdded);
	}

	public async update(): Promise<boolean> {
		const old = this.toString();

		const window = await getActiveWindow();
		if (window) {
			const windowPath = (window.path || '').toLowerCase();
			const name = path.basename(windowPath);
			if (POE_NAMES.includes(name)) {
				this.updateWindow(window, "Client.txt");
			} else if (POE_KOREAN_NAMES.includes(name)) {
				this.updateWindow(window, "KakaoClient.txt");
			} else {
				this.active = false;
			}
		} else {
			this.active = false;
		}
		return old !== this.toString();
	}

	public focus(): void {
		if (this.window?.bringToTop) {
			this.window.bringToTop();
		}
	}

	private toString(): string {
		return JSON.stringify({
			active: this.active,
			bounds: this.bounds,
			processId: this.window?.processId,
		});
	}

	private updateWindow(window: Window, logFileName: string): void {
		const title = window.title();
		if (POE_TITLES.includes(title) || POE_ALTERNATIVE_TITLES.some((x) => title.startsWith(x))) {
			this.window = window;
			this.active = true;
			this.bounds = window.bounds();
			this.gameLogListener.setLogFilePath(path.join(path.parse(window.path).dir, "logs", logFileName));
		} else {
			this.active = false;
		}
	}
}

export function register(serve: boolean, ipcMain: IpcMain, getMainWindow: GetMainWindowDelegate, send: SendIpcDelegate): void {
	const game = new Game((logLine) => send(IpcChannels.GameLogLine, logLine));

	ipcMain.on(IpcChannels.GameFocus, (event) => {
		const win = getMainWindow();
		if (!win) {
			event.returnValue = false;
			return;
		}

		win.setAlwaysOnTop(false);
		win.setVisibleOnAllWorkspaces(false);

		game.focus();

		win.setAlwaysOnTop(true, 'pop-up-menu', 1);
		win.setVisibleOnAllWorkspaces(true);

		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.GameSendActiveChange, (event) => {
		onUpdate(serve, game, getMainWindow, send);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.MainWindowBounds, (event) => {
		const win = getMainWindow();
		const windowBounds = win?.getBounds() || { x: 0, y: 0, width: 0, height: 0 };
		event.returnValue = [windowBounds, game.bounds || windowBounds];
	});

	setInterval(async () => {
		if (await game.update()) {
			onUpdate(serve, game, getMainWindow, send);
		}
	}, 500);
}

function onUpdate(serve: boolean, game: Game, getMainWindow: GetMainWindowDelegate, send: SendIpcDelegate) {
	const win = getMainWindow();

	if (win === null) {
		return;
	}

	send(IpcChannels.GameActiveChange, serve ? true : game.active);

	if (game.active) {
		if (process.platform !== 'linux') {
			win.setAlwaysOnTop(true, 'pop-up-menu', 1);
			win.setVisibleOnAllWorkspaces(true);
		} else {
			win.setAlwaysOnTop(true);
			win.maximize();
		}

		if (game.bounds) {
			send(IpcChannels.GameBoundsChange, game.bounds);
		}
	} else {
		win.setAlwaysOnTop(false);
		win.setVisibleOnAllWorkspaces(false);
	}
}
