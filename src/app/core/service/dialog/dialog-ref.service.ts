import { Injectable } from '@angular/core';
import { ShortcutService } from '@core/service/input';
import { Dialog, VisibleFlag } from '@shared/type';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

const dialogServiceRef = 'dialog-service';

@Injectable({
	providedIn: 'root',
})
export class DialogRefService {
	private readonly dialogs: Dialog[] = [];
	private readonly dialogsChange$ = new BehaviorSubject<Dialog[]>([]);

	private escapeSubscription?: Subscription;
	private spaceSubscription?: Subscription;

	constructor(private readonly shortcutService: ShortcutService) { }

	public register(): void {
		if (!this.escapeSubscription) {
			const clearShortcut = () => {
				this.escapeSubscription?.unsubscribe();
				this.escapeSubscription = undefined;
			};

			this.escapeSubscription = this.shortcutService
				.add(
					'escape',
					dialogServiceRef,
					VisibleFlag.Game | VisibleFlag.Dialog,
					VisibleFlag.Overlay | VisibleFlag.Dialog,
					VisibleFlag.Browser
				)
				.subscribe({
					next: () => this.close(),
					error: clearShortcut,
					complete: clearShortcut
				});
		}

		if (!this.spaceSubscription) {
			const clearShortcut = () => {
				this.spaceSubscription?.unsubscribe();
				this.spaceSubscription = undefined;
			};

			this.spaceSubscription = this.shortcutService
				.add(
					'space',
					dialogServiceRef,
					VisibleFlag.Game | VisibleFlag.Dialog,
					VisibleFlag.Overlay | VisibleFlag.Dialog
				)
				.subscribe({
					next: () => this.closeAll(),
					error: clearShortcut,
					complete: clearShortcut
				});
		}

		this.shortcutService.enableAllByRef(dialogServiceRef);
	}

	public reset(): void {
		this.shortcutService.disableAllByRef(dialogServiceRef);
		this.closeAll();
	}

	public dialogsChange(): Observable<Dialog[]> {
		return this.dialogsChange$;
	}

	public add(dialog: Dialog): void {
		this.dialogs.push(dialog);
		this.dialogsChange$.next(this.dialogs);
	}

	public remove(dialog: Dialog): void {
		const index = this.dialogs.indexOf(dialog);
		if (index !== -1) {
			this.dialogs.splice(index, 1);
			this.dialogsChange$.next(this.dialogs);
		}
	}

	private close(): void {
		if (this.dialogs.length > 0) {
			this.dialogs.pop()!.close();
			this.dialogsChange$.next(this.dialogs);
		}
	}

	private closeAll(): void {
		while (this.dialogs.length > 0) {
			this.close();
		}
	}
}
