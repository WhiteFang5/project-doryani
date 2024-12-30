import { Injectable } from '@angular/core';
import { ExportedItem, Item, ItemCategory, ItemGemQualityType, ItemRarity, ItemSection, ItemSectionParserService, Section } from '@shared/item/type';
import { BaseItemTypesService, ClientStringService, WordService } from '@shared/service';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionRarityParserService implements ItemSectionParserService {
	constructor(
		private readonly clientString: ClientStringService,
		private readonly baseItemTypesService: BaseItemTypesService,
		private readonly wordService: WordService
	) { }

	public optional = false;
	public section = ItemSection.Rartiy;

	public parse(item: ExportedItem, target: Item): Section | null {
		const itemClassPhrase = `${this.clientString.translate('ItemDisplayStringClass')}: `;

		const raritySection = item.sections.find((x) => x.content.indexOf(itemClassPhrase) === 0);
		if (!raritySection) {
			console.warn('[ItemRarityParser] Failed to find Item Class.');
			return null;
		}

		const lines = raritySection.lines;
		let lineIdx = 0;

		// Lookup rarity based on item class
		const itemClassRarities = this.getItemClassRarities();
		const itemClassValue = lines[lineIdx].slice(itemClassPhrase.length).trim();
		const itemClassRarity = itemClassRarities.find((x) => x.key === itemClassValue);

		if (itemClassRarity) {
			target.rarity = itemClassRarity.value;
		}

		lineIdx++;

		// Looks up rarity based on the item description
		if (!target.rarity) {
			const rarityPhrase = `${this.clientString.translate('ItemDisplayStringRarity')}: `;
			const rarityLine = lines[lineIdx];

			if (!rarityLine.startsWith(rarityPhrase)) {
				console.warn(`[ItemRarityParser] Failed to find Item Rarity for '${rarityLine}' with Item Class '${itemClassValue}'.`);
				return null;
			}

			const rarities = this.getRarities();
			const rarityValue = rarityLine.slice(rarityPhrase.length).trim();

			const rarity = rarities.find((x) => x.key === rarityValue);
			if (!rarity) {
				console.warn(`[ItemRarityParser] Failed to find Item Rarity for '${rarityValue}' and Item Class '${itemClassValue}'.`);
				return null;
			}

			target.rarity = rarity.value;

			lineIdx++;
		}

		const linesRemaining = lines.length - lineIdx;
		switch (linesRemaining) {
			case 1:
				target.type = lines[lineIdx].replace(/<<[^>>]*>>/g, '');
				target.typeId = this.baseItemTypesService.searchId(target.type) || this.baseItemTypesService.searchId(target.type, Language.English);
				lineIdx++;
				break;
			case 2:
				target.name = lines[lineIdx].replace(/<<[^>>]*>>/g, '');
				target.nameId = this.wordService.search(target.name) || this.wordService.search(target.name, Language.English);
				lineIdx++;
				target.type = lines[lineIdx].replace(/<<[^>>]*>>/g, '');
				target.typeId = this.baseItemTypesService.searchId(target.type) || this.baseItemTypesService.searchId(target.type, Language.English);
				lineIdx++;
				break;
			default:
				console.warn(`[ItemRarityParser] Incorrect line count for this section. Expected 1~2, found ${lines.length}`);
				return null;
		}

		if (!target.typeId) {
			console.warn(`[ItemRarityParser] Failed to find Base Item Type for '${target.type}'`);
			return null;
		}

		target.category = this.baseItemTypesService.get(target.typeId)?.category;

		if (!target.category) {
			console.warn(`[ItemRarityParser] Failed to find Item Category for '${target.type}' (${target.typeId})`);
			return null;
		}

		// Check for gem naming
		if (
			target.category === ItemCategory.Gem ||
			target.category.indexOf(`${ItemCategory.Gem}.`) === 0
		) {
			if (!target.properties) {
				target.properties = {};
			}

			// Check for vaal gem
			for (const section of item.sections) {
				if (section.lines.length !== 1) {
					continue;
				}

				if (section.lines[0].length <= target.type.length) {
					continue;
				}

				const type = section.lines[0];
				const id = this.baseItemTypesService.searchId(type);
				if (id === undefined || id.indexOf('Vaal') === -1) {
					continue;
				}

				target.typeId = id;
				target.type = type;
				break;
			}

			// Check for alternate quality
			target.properties.gemQualityType = ItemGemQualityType.Default;
		}

		return raritySection;
	}

	private getItemClassRarities(): {
		key: string;
		value: ItemRarity;
	}[] {
		return [
		];
	}

	private getRarities(): {
		key: string;
		value: ItemRarity;
	}[] {
		return [
			{
				key: this.clientString.translate('ItemDisplayStringNormal'),
				value: ItemRarity.Normal,
			},
			{
				key: this.clientString.translate('ItemDisplayStringMagic'),
				value: ItemRarity.Magic,
			},
			{
				key: this.clientString.translate('ItemDisplayStringRare'),
				value: ItemRarity.Rare,
			},
			{
				key: this.clientString.translate('ItemDisplayStringUnique'),
				value: ItemRarity.Unique,
			},
			{
				key: this.clientString.translate('ItemDisplayStringCurrency'),
				value: ItemRarity.Currency,
			},
			{
				key: this.clientString.translate('ItemDisplayStringGem'),
				value: ItemRarity.Gem,
			},
			{
				key: this.clientString.translate('ItemDisplayStringDivinationCard'),
				value: ItemRarity.DivinationCard,
			},
			{
				key: this.clientString.translate('ItemDisplayStringQuest'),
				value: ItemRarity.Quest,
			},
		];
	}
}
