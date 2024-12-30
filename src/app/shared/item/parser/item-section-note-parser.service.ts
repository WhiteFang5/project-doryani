import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionNoteParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Note;

	public parse(item: ExportedItem, target: Item): Section | null {
		const phrase = `${this.clientString.translate('ItemDisplayStringNote')}: `;

		const noteSection = item.sections.find((x) => x.content.indexOf(phrase) === 0);
		if (!noteSection) {
			return null;
		}

		target.note = noteSection.lines[0].slice(phrase.length);
		return noteSection;
	}
}
