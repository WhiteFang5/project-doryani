import { Injectable } from '@angular/core';
import { Item, ItemProcessorOptions } from '@shared/item/type';
import { ItemDamageProcessorService } from './item-damage-processor.service';
import { ItemModifierMagnitudeProcessorService } from './item-modifier-magnitude-processor.service';
import { ItemQualityProcessorService } from './item-quality-processor.service';

@Injectable({
	providedIn: 'root',
})
export class ItemProcessorService {
	constructor(
		private readonly itemQualityProcessorService: ItemQualityProcessorService,
		private readonly itemDamageProcessorService: ItemDamageProcessorService,
		private readonly itemMagnitudeProcessorService: ItemModifierMagnitudeProcessorService,
	) { }

	public process(item: Item | undefined, options: ItemProcessorOptions): void {
		if (!item) {
			return;
		}
		this.itemQualityProcessorService.process(item, options.normalizeQuality);
		this.itemDamageProcessorService.process(item);
		this.itemMagnitudeProcessorService.process(item);
	}
}
