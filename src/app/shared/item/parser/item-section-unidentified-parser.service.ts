import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionUnidentifiedParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Unidentified;

	public parse(item: ExportedItem, target: Item): Section | null {
		const phrase = new RegExp(`^${this.clientString.translate('ItemPopupUnidentified')}$`);

		const unidentifiedSection = item.sections.find((x) => phrase.test(x.content));
		if (!unidentifiedSection) {
			return null;
		}

		target.unidentified = true;
		return unidentifiedSection;
	}
}
