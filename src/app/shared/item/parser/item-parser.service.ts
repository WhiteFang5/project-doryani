import { Injectable } from '@angular/core';
import { ofType } from '@core/function';
import { ExportedItem, Item, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { ItemSectionCorruptedParserService } from './item-section-corrupted-parser.service';
import { ItemSectionFlaskParserService } from './item-section-flask-parser.service';
import { ItemSectionItemLevelParserService } from './item-section-item-level-parser.service';
import { ItemSectionMirroredParserService } from './item-section-mirrored-parser.service';
import { ItemSectionNoteParserService } from './item-section-note-parser.service';
import { ItemSectionPropertiesParserService } from './item-section-properties-parser.service';
import { ItemSectionRarityParserService } from './item-section-rarity-parser.service';
import { ItemSectionRelicParserService } from './item-section-relic-parser.service';
import { ItemSectionRequirementsParserService } from './item-section-requirements-parser.service';
import { ItemSectionSocketsParserService } from './item-section-sockets-parser.service';
import { ItemSectionStatsParserService } from './item-section-stats-parser.service';
import { ItemSectionUnidentifiedParserService } from './item-section-unidentified-parser.service';

@Injectable({
	providedIn: 'root',
})
export class ItemParserService {
	private readonly parsers: ItemSectionParserService[];

	constructor(
		itemSectionRarityParser: ItemSectionRarityParserService,
		itemSectionRequirementsParserService: ItemSectionRequirementsParserService,
		itemSectionNoteParserService: ItemSectionNoteParserService,
		itemSectionItemLevelParserService: ItemSectionItemLevelParserService,
		itemSectionSocketsParserService: ItemSectionSocketsParserService,
		itemSectionPropertiesParserService: ItemSectionPropertiesParserService,
		itemSectionCorruptedParserService: ItemSectionCorruptedParserService,
		itemSectionMirroredParserService: ItemSectionMirroredParserService,
		itemSectionStatsParserService: ItemSectionStatsParserService,
		itemSectionUnidentifiedParserService: ItemSectionUnidentifiedParserService,
		itemSectionFlaskParserService: ItemSectionFlaskParserService,
		itemSectionRelicParserService: ItemSectionRelicParserService,
	) {
		this.parsers = [
			itemSectionRarityParser,
			itemSectionRequirementsParserService,
			itemSectionNoteParserService,
			itemSectionItemLevelParserService,
			itemSectionSocketsParserService,
			itemSectionRelicParserService, // Parse prior to Properties
			itemSectionPropertiesParserService,
			itemSectionFlaskParserService, // Properties have to be parsed first in case the Flask Parser contains Quality.
			// Properties have to be parsed first in case the Gem Experience Parser needs to adjust some properties.
			itemSectionCorruptedParserService,
			itemSectionMirroredParserService,
			itemSectionUnidentifiedParserService,
			itemSectionStatsParserService,
		];
	}

	public parse(
		stringifiedItem: string,
		sections?: Record<number, boolean>
	): Item | null {
		const exportedItem: ExportedItem = {
			sections: stringifiedItem
				.split('--------')
				.map((section) => section.split(/\r?\n/).filter((line) => line.length > 0))
				.filter((lines) => lines.length > 0)
				.map((lines) => {
					const section: Section = {
						lines,
						content: lines.join('\n'),
					};
					return section;
				}),
		};

		const target: Item = {
			source: stringifiedItem,
		};

		for (const parser of this.parsers) {
			if (sections && !sections[parser.section]) {
				continue;
			}
			const sectionOrSections = parser.parse(exportedItem, target);
			if (!sectionOrSections) {
				if (!parser.optional) {
					console.log(`[ItemParser] Failed to parse required section '${ItemSection[parser.section]}'`);
					return null;
				} else {
					continue;
				}
			} else if (ofType<Section>(sectionOrSections)) {
				exportedItem.sections.splice(exportedItem.sections.indexOf(sectionOrSections), 1);
			} else {
				sectionOrSections.forEach((section) => {
					exportedItem.sections.splice(exportedItem.sections.indexOf(section), 1);
				});
			}
		}
		return target;
	}
}
