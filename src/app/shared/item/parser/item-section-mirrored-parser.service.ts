import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionMirroredParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Mirrored;

	public parse(item: ExportedItem, target: Item): Section | null {
		const phrase = new RegExp(`^${this.clientString.translate('ItemPopupMirrored')}$`);

		const mirroredSection = item.sections.find(section => phrase.test(section.content));
		if (!mirroredSection) {
			return null;
		}

		target.mirrored = true;

		return mirroredSection;
	}
}
