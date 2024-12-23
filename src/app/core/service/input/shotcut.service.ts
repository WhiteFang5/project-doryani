import { Injectable, NgZone } from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { IpcChannels } from '@ipc-consts';
import { VisibleFlag } from '@shared/type';
import { IpcRenderer } from 'electron';
import { Observable, Subject } from 'rxjs';

export interface Shortcut {
	accelerator: string;
	ref: unknown;
	actives: VisibleFlag[];
	callback: Subject<void>;
	disabled: boolean;
	isActive: boolean;
}

type ShortcutDict = Record<string, Shortcut[]>;

@Injectable({
	providedIn: 'root',
})
export class ShortcutService {
	private readonly ipcRenderer: IpcRenderer;
	private readonly shortcuts: ShortcutDict = {};

	private lastFlag = VisibleFlag.None;

	constructor(
		private readonly ngZone: NgZone,
		electronProvider: ElectronProvider
	) {
		this.ipcRenderer = electronProvider.provideIpcRenderer();
	}

	public add(
		accelerator: string,
		ref: unknown,
		...actives: VisibleFlag[]
	): Observable<void> {
		if (!this.shortcuts[accelerator]) {
			this.shortcuts[accelerator] = [];
		}

		const shortcut: Shortcut = {
			accelerator,
			ref,
			actives,
			callback: new Subject<void>(),
			disabled: false,
			isActive: false,
		};
		this.shortcuts[accelerator].unshift(shortcut);

		this.check(this.lastFlag);

		return shortcut.callback;
	}

	public remove(accelerator: string, ref: unknown): void {
		const shortcuts = this.shortcuts[accelerator];
		if (shortcuts) {
			const index = shortcuts.findIndex((x) => x.ref === ref);
			if (index !== -1) {
				const shortcut = shortcuts[index];
				if (shortcut.isActive) {
					this.unregisterShortcut(shortcut);
				}
				shortcut.callback.complete();
				shortcuts.splice(index, 1);
				this.check(this.lastFlag);
			}
		}
	}

	public removeAllByRef(ref: unknown): void {
		for (const accelerator in this.shortcuts) {
			const shortcuts = this.shortcuts[accelerator];
			const activeShortcut = shortcuts.find((x) => x.isActive && x.ref === ref);
			if (activeShortcut) {
				this.unregisterShortcut(activeShortcut);
			}
			const removedShortcuts = shortcuts.filter((x) => x.ref === ref);
			this.shortcuts[accelerator] = shortcuts.filter((x) => x.ref !== ref);
			removedShortcuts.forEach((x) => x.callback.complete());
		}
		this.check(this.lastFlag);
	}

	public disableAllByAccelerator(accelerator: string): void {
		const shortcuts = this.shortcuts[accelerator];
		if (shortcuts) {
			shortcuts.forEach((shortcut) => (shortcut.disabled = true));
			this.check(this.lastFlag);
		}
	}

	public enableAllByAccelerator(accelerator: string): void {
		const shortcuts = this.shortcuts[accelerator];
		if (shortcuts) {
			shortcuts.forEach((shortcut) => (shortcut.disabled = false));
			this.check(this.lastFlag);
		}
	}

	public disableAllByRef(ref: unknown): void {
		for (const accelerator in this.shortcuts) {
			const shortcuts = this.shortcuts[accelerator];
			shortcuts.forEach((shortcut) => {
				if (shortcut.ref === ref) {
					shortcut.disabled = true;
				}
			});
		}
		this.check(this.lastFlag);
	}

	public enableAllByRef(ref: unknown): void {
		for (const accelerator in this.shortcuts) {
			const shortcuts = this.shortcuts[accelerator];
			shortcuts.forEach((shortcut) => {
				if (shortcut.ref === ref) {
					shortcut.disabled = false;
				}
			});
		}
		this.check(this.lastFlag);
	}

	public disable(accelerator: string, ref: unknown): void {
		const shortcuts = this.shortcuts[accelerator];
		if (shortcuts) {
			const index = shortcuts.findIndex((x) => x.ref === ref);
			if (index !== -1) {
				const shortcut = shortcuts[index];
				shortcut.disabled = true;
				this.check(this.lastFlag);
			}
		}
	}

	public enable(accelerator: string, ref: unknown): void {
		const shortcuts = this.shortcuts[accelerator];
		if (shortcuts) {
			const index = shortcuts.findIndex((x) => x.ref === ref);
			if (index !== -1) {
				const activeIndex = shortcuts.findIndex((x) => x.isActive);
				const shortcut = shortcuts[index];
				shortcut.disabled = false;
				if (activeIndex !== -1 && index < activeIndex) {
					this.unregisterShortcut(shortcuts[activeIndex]);
					this.check(this.lastFlag);
				}
			}
		}
	}

	public check(flag: VisibleFlag): void {
		this.lastFlag = flag;
		for (const accelerator in this.shortcuts) {
			const activeShortcut = this.shortcuts[accelerator].find((x) => x.isActive);
			if (
				activeShortcut &&
				(activeShortcut.disabled ||
					!activeShortcut.actives.some((filter) => (flag & filter) === filter))
			) {
				this.unregisterShortcut(activeShortcut);
			}
			const nextShortcut = this.shortcuts[accelerator].find(
				(x) => !x.disabled && x.actives.some((filter) => (flag & filter) === filter)
			);
			if (nextShortcut) {
				this.registerShortcut(nextShortcut);
			}
		}
	}

	public reset(): void {
		for (const accelerator in this.shortcuts) {
			const shortcuts = this.shortcuts[accelerator];
			if (shortcuts.length > 0) {
				const activeShortcut = shortcuts.find((x) => x.isActive);
				if (activeShortcut) {
					this.unregisterShortcut(activeShortcut);
				}
				this.shortcuts[accelerator] = [];
				shortcuts.forEach((x) => x.callback.complete());
			}
		}
	}

	private registerShortcut(shortcut: Shortcut): void {
		shortcut.isActive = true;
		this.ipcRenderer.on(`${IpcChannels.ShortcutPrefix}${shortcut.accelerator}`, () => {
			this.ngZone.run(() => shortcut.callback.next());
		});
		this.ipcRenderer.sendSync(IpcChannels.RegisterShortcut, shortcut.accelerator);
	}

	private unregisterShortcut(shortcut: Shortcut): void {
		shortcut.isActive = false;
		this.ipcRenderer.removeAllListeners(`${IpcChannels.ShortcutPrefix}${shortcut.accelerator}`);
		this.ipcRenderer.sendSync(IpcChannels.UnregisterShortcut, shortcut.accelerator);
	}
}
