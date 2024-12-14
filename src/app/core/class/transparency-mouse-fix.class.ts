import { IpcChannels } from '@ipc-consts';
import { IpcRenderer } from 'electron';

// This class makes it possible to make certain elements clickable and keeping others click-through.
//
// It also contains a workaround for the following issue:
//   setIgnoreMouseEvents({forward: true}) stops forwarding after a page reload
//   https://github.com/electron/electron/issues/15376
//
//   The main idea is to poll the mouse every frame once a reload has occured.
//
// Transparency-checking is based on comments posted here: https://github.com/electron/electron/issues/1335
// The work-around is based on https://github.com/toonvanvr/electron-transparency-mouse-fix/blob/348bd943864671801324cf50c939f96eec448f40/src/electron-transparency-mouse-fix.js

export class TransparencyMouseFix {
	private readonly STYLE_ID = 'tmf-css';
	private readonly SESSION_STORAGE_KEY = 'tmf-reloaded';
	private readonly SESSION_STORAGE_VALUE = 'true';

	private readonly ipcRenderer: IpcRenderer;
	private readonly htmlWindow: Window;

	private readonly scopedOnMouseEvent;
	private readonly scopedManualPoll;

	private ignoreMouse = true;
	private fixPointerEvents = false;
	private manualPollingInstanceCount = 0;

	constructor(ipcRenderer: IpcRenderer, private readonly log = false) {
		this.ipcRenderer = ipcRenderer;
		this.htmlWindow = window;

		this.scopedOnMouseEvent = (event: Event) => this.onMouseEvent(event);
		this.scopedManualPoll = () => this.manualMousePoll();

		this.registerListeners();
		this.tryStartPolling();
	}

	public dispose(): void {
		this.unregister(this.htmlWindow);
	}

	private registerListeners(): void {
		this.log && console.log('tmf-registerListeners');

		this.htmlWindow.addEventListener('mousemove', this.scopedOnMouseEvent);
		this.htmlWindow.addEventListener('beforeunload', () => this.unregister(this.htmlWindow));
		const styleSheet = this.htmlWindow.document.createElement('style');
		styleSheet.id = this.STYLE_ID;
		styleSheet.innerHTML = `html { pointer-events: none; }`;
		this.htmlWindow.document.head.appendChild(styleSheet);
	}

	private unregister(htmlWindow: Window): void {
		this.log && console.log('tmf-unregister');

		htmlWindow.document.getElementById(this.STYLE_ID)?.remove();

		htmlWindow.removeEventListener('mousemove', this.scopedOnMouseEvent);

		sessionStorage.setItem(this.SESSION_STORAGE_KEY, this.SESSION_STORAGE_VALUE);

		this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, false);
	}

	private shouldIgnoreMouseEvents(element: any): boolean {
		return element === this.htmlWindow.document.documentElement;
	}

	private onMouseEvent(event: Event): void {
		this.log && console.log('tmf.onMouseEvent');

		this.updateMouseEvents(event.target);
	}

	private updateMouseEvents(target: any): void {
		this.log && console.log('tmf.updateMouseEvents');

		if (this.shouldIgnoreMouseEvents(target)) {
			if (this.ignoreMouse) return;
			this.ignoreMouse = true;

			if (this.fixPointerEvents) {
				// Circumvent forwarding of ignored mouse events
				this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, true, false);
				this.manualMousePoll(true);
			} else {
				// Ignore mouse events with built-in forwarding
				this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, true, true);
			}
		} else {
			if (!this.ignoreMouse) return;
			this.ignoreMouse = false;

			// Catch all mouse events
			this.ipcRenderer.sendSync(IpcChannels.SetIgnoreMouseEvents, false);
		}
	}

	private tryStartPolling(): void {
		this.fixPointerEvents = true;
		switch (process.platform) {
			case 'win32':
				// Only windows has this mouse issue after a reload, so check if polling has to occur.
				if (sessionStorage.getItem(this.SESSION_STORAGE_KEY) !== this.SESSION_STORAGE_VALUE) {
					this.fixPointerEvents = false;
				}
				break;

			case 'darwin':
				// MacOS doesn't have this mouse issue, so there's no need to start polling.
				this.fixPointerEvents = false;
				break;
		}

		if (this.fixPointerEvents) {
			this.manualMousePoll(true);
		}
	}

	/**
	 * Circumvent the lack of forwarded mouse events by polling mouse position with requestAnimationFrame
	 * @returns {boolean} True if a element is found besides sinkholes or the main <html> element
	 */
	private manualMousePoll(first = false): boolean | null {
		// HINT: you can manually stop the loop by incrementing manualPollingInstanceCount
		if (first) {
			this.manualPollingInstanceCount++;
		}
		if (this.manualPollingInstanceCount > 1) {
			this.manualPollingInstanceCount--;
			return null;
		}

		// If the cursor is within content bounds, check the element it's hovering,
		//   emulate a MouseMove event with the element as target
		const { x, y } = this.ipcRenderer.sendSync(IpcChannels.GetCursorScreenPoint);
		const { x: left, y: top, width, height } = this.ipcRenderer.sendSync(IpcChannels.GetContentBounds);
		if (x >= left && x < left + width && y >= top && y < top + height) {
			const target = document.elementFromPoint(x - left, y - top);
			// HINT: update classList checks when expanding code
			if (target && !this.shouldIgnoreMouseEvents(target)) {
				this.updateMouseEvents(target);
				this.manualPollingInstanceCount--;
				return true;
			}
		}

		requestAnimationFrame(this.scopedManualPoll);
		return false;
	}
}
