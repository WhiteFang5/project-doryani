import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionItemLevelParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.ItemLevel;

	public parse(item: ExportedItem, target: Item): Section | null {
		let itemLevel: string;

		const itemLevelPhrase = `${this.clientString.translate('ItemDisplayStringItemLevel')}: `;

		const itemLevelSection = item.sections.find((x) => x.content.indexOf(itemLevelPhrase) === 0) || null;
		if (itemLevelSection) {
			itemLevel = itemLevelSection.lines[0].slice(itemLevelPhrase.length);
		}

		if (!itemLevelSection) {
			return null;
		}

		target.level = {
			text: itemLevel!,
			value: +itemLevel!,
		};

		return itemLevelSection;
	}
}
