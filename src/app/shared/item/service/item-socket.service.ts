import { Injectable } from '@angular/core';
import { ItemSocket } from '@shared/item/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSocketService {
	public getLinkCount(sockets: ItemSocket[] | undefined): number {
		if (!sockets) {
			return 0;
		}
		let count = 0;
		let maxCount = 0
			; (sockets || []).forEach((x) => {
				if (x.linked) {
					++count;
				}
				if (count > maxCount) {
					maxCount = count;
				}
				if (!x.linked) {
					count = 0;
				}
			});
		if (maxCount > 0) {
			++maxCount;
		}
		return maxCount;
	}
}
