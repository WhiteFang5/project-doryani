import { Injectable, NgZone } from '@angular/core';
import { TransparencyMouseFix } from '@core/class/transparency-mouse-fix.class';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { Rectangle } from '@shared/type';
import { IpcRenderer, Point } from 'electron';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class WindowService {
	public readonly gameBounds: BehaviorSubject<Rectangle>;

	// Don't remove this. We need to keep the instance, but don't actually use it (because all magic happens inside)
	private transparencyMouseFix?: TransparencyMouseFix;

	private readonly ipcRenderer: IpcRenderer;

	constructor(private readonly ngZone: NgZone, electronProvider: ElectronProvider) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
		this.gameBounds = new BehaviorSubject<Rectangle>(this.getWindowBounds());
	}

	public registerEvents(): void {
		this.ipcRenderer.on(IpcChannels.GameBoundsChange, (_, bounds: Rectangle) => {
			this.gameBounds.next(bounds);
		});
	}

	public enableTransparencyMouseFix(): void {
		this.transparencyMouseFix = new TransparencyMouseFix(this.ipcRenderer);
	}

	public disableTransparencyMouseFix(ignoreMouse = false): void {
		this.transparencyMouseFix?.dispose();
		this.transparencyMouseFix = undefined;

		this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, ignoreMouse, ignoreMouse);
	}

	public getMainWindowBounds(): [Rectangle, Rectangle] {
		return this.ipcRenderer.sendSync(IpcChannels.MainWindowBounds);
	}

	public getWindowBounds(): Rectangle {
		const bounds = this.ipcRenderer.sendSync(IpcChannels.GetBounds);
		return bounds || { x: 0, y: 0, width: 0, height: 0 };
	}

	public getOffsettedGameBounds(useLocalBounds = true): Rectangle {
		let bounds: Rectangle;
		let poeBounds: Rectangle;
		if (useLocalBounds) {
			bounds = this.getWindowBounds();
			poeBounds = this.gameBounds.value;
		} else {
			const remoteBounds = this.getMainWindowBounds();
			bounds = remoteBounds[0];
			poeBounds = remoteBounds[1];
		}
		return {
			x: poeBounds.x - bounds.x,
			y: poeBounds.y - bounds.y,
			width: poeBounds.width,
			height: poeBounds.height,
		};
	}

	public hide(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Hide);
	}

	public show(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Show);
	}

	public focus(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Focus);
	}

	public blur(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Blur);
	}

	public minimize(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Minimize);
	}

	public restore(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Restore);
	}

	public close(): void {
		this.ipcRenderer.sendSync(IpcChannels.WindowCommand, IpcChannels.WindowCommands.Close);
	}

	public getZoom(): number {
		return this.ipcRenderer.sendSync(IpcChannels.GetZoomFactor);
	}

	public setZoom(zoom: number): void {
		this.ipcRenderer.sendSync(IpcChannels.SetZoomFactor, zoom);
	}

	public setSize(width: number, height: number): void {
		this.ipcRenderer.sendSync(IpcChannels.SetSize, width, height);
	}

	public disableInput(focusable: boolean): void {
		if (focusable) {
			this.blur();
		}
		this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, true, true);
		if (focusable) {
			this.ipcRenderer.sendSync(IpcChannels.SetFocusable, false);
		}
	}

	public enableInput(focusable: boolean): void {
		if (focusable) {
			this.ipcRenderer.sendSync(IpcChannels.SetFocusable, true);
			this.ipcRenderer.sendSync(IpcChannels.SetSkipTaskbar, true);
		}
		this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, false);
		if (focusable) {
			this.focus();
		}
	}

	public convertToLocal(point: Point): Point {
		const winBounds = this.getWindowBounds();
		const poeBounds = this.gameBounds.value;
		const local = {
			...point,
		};
		local.x -= winBounds.x - poeBounds.x;
		local.x = Math.min(Math.max(local.x, 0), winBounds.width);
		local.y -= winBounds.y - poeBounds.y;
		local.y = Math.min(Math.max(local.y, 0), winBounds.height);
		return local;
	}

	public convertToLocalScaled(local: Point): Point {
		const point = {
			...local,
		};

		const zoomFactor = this.getZoom();
		point.x *= 1 / zoomFactor;
		point.y *= 1 / zoomFactor;
		return point;
	}
}
