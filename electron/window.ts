/* eslint-disable @typescript-eslint/no-require-imports */
import { Rectangle } from 'electron';
// import { addon, windowManager } from 'node-window-manager';

export interface Window {
	processId: number;
	path: string;
	title: () => string;
	bounds: () => Rectangle;
	bringToTop?: () => void;
}

// macos only - probably not needed for now
// windowManager.requestAccessibility();

export async function getActiveWindow(): Promise<Window | undefined> {
	try {
		const isLinux = process.platform !== 'win32' && process.platform !== 'darwin';

		if (isLinux) {
			const active = await require('get-windows').activeWindow();

			if (!active) {
				return undefined;
			}

			return {
				processId: active.owner.processId,
				path: active.owner.path,
				bounds: () => active.bounds,
				title: () => active.title,
			};
		} else {
			const active = {} as any//windowManager.getActiveWindow();
			const addon = {} as any

			if (!active) {
				return undefined;
			}

			return {
				processId: active.processId,
				path: active.path,
				bounds: () => addon.getWindowBounds(active.id),
				title: () => active.getTitle(),
				bringToTop: () => active.bringToTop(),
			};
		}
	} catch (error) {
		console.warn('Could not get active window.', error);
		return undefined;
	}
}
