import { Injectable } from '@angular/core';
import { ClipboardService, KeyboardService } from '@core/service/input';
import { StashNavigationDirection, StashPriceTag } from '@shared/stash/type/stash.type';
import { KeyCode } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class StashService {
	constructor(
		private readonly keyboard: KeyboardService,
		private readonly clipboard: ClipboardService,
	) {
	}

	public navigate(dir: StashNavigationDirection): void {
		this.keyboard.setKeyboardDelay(5);
		this.keyboard.keyTap(dir === StashNavigationDirection.Left ? KeyCode.ArrowLeft : KeyCode.ArrowRight);
	}

	public copyPrice(tag: StashPriceTag): void {
		this.clipboard.writeText(
			`${tag.type} ${tag.count ? `${tag.amount}/${tag.count}` : tag.amount} ${tag.currency.id}`
		);
	}
}
