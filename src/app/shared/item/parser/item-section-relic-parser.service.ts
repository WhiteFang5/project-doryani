import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemRarity, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionRelicParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Relic;

	public parse(item: ExportedItem, target: Item): Section | null {
		const phrase = new RegExp(`^${this.clientString.translate('ItemPopupRelicUnique')}$`);

		const relicSection = item.sections.find((x) => phrase.test(x.content));
		if (!relicSection) {
			return null;
		}

		target.rarity = ItemRarity.UniqueRelic;
		target.relic = true;
		return relicSection;
	}
}
