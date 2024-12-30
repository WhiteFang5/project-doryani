import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, ItemSocket, ItemSocketColor, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionSocketsParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Sockets;

	public parse(item: ExportedItem, target: Item): Section | null {
		const phrase = `${this.clientString.translate('ItemDisplayStringSockets')}: `;

		const socketsSection = item.sections.find((x) => x.content.indexOf(phrase) === 0);
		if (!socketsSection) {
			return null;
		}

		target.sockets = [];

		// R-G-B-W R R
		const sockets = socketsSection.lines[0].slice(phrase.length);
		for (let index = 0; index < sockets.length; index += 2) {
			const socket: ItemSocket = {
				color: sockets[index] as ItemSocketColor,
				linked: sockets[index + 1] === '-',
			};
			target.sockets.push(socket);
		}
		return socketsSection;
	}
}
