import {
    App,
    BrowserWindow,
    Clipboard,
    IpcMain,
    Screen,
} from 'electron';
import { IpcChannels } from '../src/ipc-consts/ipc-consts';

export function register(app: App, ipcMain: IpcMain, screen: Screen, clipboard: Clipboard, getMainWindow: () => BrowserWindow | null): void {
	ipcMain.on(IpcChannels.AppVersion, (event) => {
		event.returnValue = app.getVersion();
	});
	ipcMain.on(IpcChannels.AppQuit, (event, relaunch: boolean) => {
		if (relaunch) {
			app.relaunch();
		}
		app.quit();
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.SetIgnoreMouseEvents, (event, ignore: boolean, forward: boolean) => {
		const win = getMainWindow();
		if (win === null) {
			event.returnValue = false;
			return;
		}
		win.setIgnoreMouseEvents(ignore, { forward });
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.GetCursorScreenPoint, (event) => {
		event.returnValue = screen.getCursorScreenPoint();
	});

	ipcMain.on(IpcChannels.GetContentBounds, (event) => {
		const win = getMainWindow();
		event.returnValue = win?.getContentBounds();
	});

	ipcMain.on(IpcChannels.GetBounds, (event) => {
		const win = getMainWindow();
		event.returnValue = win?.getBounds();
	});

	ipcMain.on(IpcChannels.GetZoomFactor, (event) => {
		const win = getMainWindow();
		event.returnValue = win?.webContents.zoomFactor;
	});

	ipcMain.on(IpcChannels.SetZoomFactor, (event, zoomFactor: number) => {
		const win = getMainWindow();
		if (win === null) {
			event.returnValue = false;
			return;
		}
		win.webContents.zoomFactor = zoomFactor;
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.SetSize, (event, width: number, height: number) => {
		const win = getMainWindow();
		if (win === null) {
			event.returnValue = false;
			return;
		}
		win.setSize(width, height);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.SetFocusable, (event, focusable: boolean) => {
		const win = getMainWindow();
		if (win === null) {
			event.returnValue = false;
			return;
		}
		win.setFocusable(focusable);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.SetSkipTaskbar, (event, skipTaskbar: boolean) => {
		const win = getMainWindow();
		if (win === null) {
			event.returnValue = false;
			return;
		}
		win.setSkipTaskbar(skipTaskbar);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.GetClipboard, (event) => {
		event.returnValue = clipboard.readText();
	});

	ipcMain.on(IpcChannels.SetClipboard, (event, text: string) => {
		clipboard.writeText(text);
		event.returnValue = true;
	});

	ipcMain.on(IpcChannels.WindowCommand, (event, command: IpcChannels.WindowCommands) => {
		const win = getMainWindow();
		if (win !== null) {
			switch (command) {
				case IpcChannels.WindowCommands.Show:
					win.show();
					break;

				case IpcChannels.WindowCommands.Hide:
					win.hide();
					break;

				case IpcChannels.WindowCommands.Minimize:
					win.minimize();
					break;

				case IpcChannels.WindowCommands.Restore:
					win.restore();
					break;

				case IpcChannels.WindowCommands.Focus:
					win.focus();
					break;

				case IpcChannels.WindowCommands.Blur:
					win.blur();
					break;

				case IpcChannels.WindowCommands.Close:
					win.close();
					break;

				default:
					console.error(`Missing Window Command for '${command}'`);
					event.returnValue = false;
					return;
			}
			event.returnValue = true;
		}
		event.returnValue = false;
	});
}

type EventHandler = (() => void);

export class WindowEventForwarder {

	private window?: BrowserWindow;

	public register(window: BrowserWindow): void {
		this.unregister();

		this.window = window;

		this.window.on('focus', this.focus);

		this.window.on('blur', this.blur);
	}

	public unregister(): void {
		if (this.window) {
			this.window.off('focus', this.focus as EventHandler);
			this.window.off('blur', this.blur as EventHandler);
			this.window = undefined;
		}
	}

	private focus = () => this.window?.webContents.send(IpcChannels.WindowFocus);

	private blur = () => this.window?.webContents.send(IpcChannels.WindowBlur);
}
