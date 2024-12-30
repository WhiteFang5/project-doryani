import { Injectable } from '@angular/core';
import { ItemParserUtils } from '@shared/item/parser/item-parser.utils';
import { ExportedItem, Item, ItemProperty, ItemRarity, ItemSection, ItemSectionParserService, ItemValueProperty, Section } from '@shared/item/type';
import { ClientStringService } from '@shared/service';

const AUGMENTED_PHRASE = ' (augmented)';

@Injectable({
	providedIn: 'root',
})
export class ItemSectionPropertiesParserService implements ItemSectionParserService {
	constructor(private readonly clientString: ClientStringService) { }

	public optional = true;
	public section = ItemSection.Properties;

	public parse(item: ExportedItem, target: Item): Section | null {
		switch (target.rarity) {
			case ItemRarity.DivinationCard:
				return null;
		}

		const phrases = this.getPhrases();
		const propertiesSection = item.sections.find(
			(section) => phrases.findIndex((prop) => section.content.indexOf(prop) !== -1) !== -1
		);
		if (!propertiesSection) {
			return null;
		}

		if (!target.properties) {
			target.properties = {};
		}

		const props = target.properties;

		const lines = propertiesSection.lines;
		for (const line of lines) {
			let phraseIdx = 0;
			switch (target.rarity) {
				case ItemRarity.Normal:
				case ItemRarity.Magic:
				case ItemRarity.Rare:
				case ItemRarity.Unique:
				case ItemRarity.UniqueRelic:
				case ItemRarity.NonUnique:
					props.weaponPhysicalDamage = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.weaponPhysicalDamage
					);
					phraseIdx++;//1
					// Elemental damage can contain multiple damage values (fire/cold/lightning/etc...)
					props.weaponElementalDamage = this.parseValueProperties(
						line,
						phrases[phraseIdx],
						props.weaponElementalDamage
					);
					phraseIdx++;//2
					props.weaponChaosDamage = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.weaponChaosDamage
					);
					phraseIdx++;//3
					props.weaponCriticalStrikeChance = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.weaponCriticalStrikeChance,
						2
					);
					phraseIdx++;//4
					props.weaponAttacksPerSecond = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.weaponAttacksPerSecond,
						2
					);
					phraseIdx++;//5
					props.weaponRange = this.parseProperty(line, phrases[phraseIdx], props.weaponRange);
					phraseIdx++;//6
					props.shieldBlockChance = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.shieldBlockChance
					);
					phraseIdx++;//7
					props.armourArmour = this.parseValueProperty(line, phrases[phraseIdx], props.armourArmour);
					phraseIdx++;//8
					props.armourEvasionRating = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.armourEvasionRating
					);
					phraseIdx++;//9
					props.armourEnergyShield = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.armourEnergyShield
					);
					phraseIdx++;//10
					props.armourSpirit = this.parseValueProperty(
						line,
						phrases[phraseIdx],
						props.armourSpirit
					);
					phraseIdx++;//11
					break;

				default:
					phraseIdx = 11;
					break;
			}
			props.stackSize = this.parseValueProperty(line, phrases[phraseIdx], props.stackSize);
			phraseIdx++;//12
			props.gemLevel = this.parseValueProperty(line, phrases[phraseIdx], props.gemLevel);
			phraseIdx++;//13
			props.mapTier = this.parseValueProperty(line, phrases[phraseIdx], props.mapTier);
			if (props.mapTier) {
				const areaLevel: number = 67 + props.mapTier.value.value!;
				props.areaLevel = {
					augmented: false,
					value: {
						text: `${areaLevel}`,
						value: areaLevel
					}
				};
			}
			phraseIdx++;//14
			props.mapBonus = this.parseValueProperty(line, phrases[phraseIdx], props.mapBonus);
			phraseIdx++;//15
			for (let quality = 0; quality < 11; quality++, phraseIdx++) {//18-28
				const old = props.quality;
				props.quality = this.parseValueProperty(line, phrases[phraseIdx], old);
				if (props.quality !== old) {
					props.qualityType = quality;
				}
			}
		}

		return propertiesSection;
	}

	private parseProperty(line: string, phrase: string, prop: ItemProperty | undefined): ItemProperty | undefined {
		const [text, augmented] = this.parsePhrase(line, phrase);
		if (!text) {
			return prop;
		}
		const property: ItemProperty = {
			augmented,
			value: text,
		};
		return property;
	}

	private parseValueProperties(
		line: string,
		phrase: string,
		prop: ItemValueProperty[] | undefined,
		numDecimals = 0
	): ItemValueProperty[] | undefined {
		if (line.indexOf(phrase) !== 0) {
			return prop;
		}
		return line
			.slice(phrase.length)
			.split(',')
			.map((t) => {
				const [text, augmented] = this.parseText(t.trim());
				const property: ItemValueProperty = {
					augmented,
					value: ItemParserUtils.parseItemValue(text, numDecimals),
				};
				return property;
			});
	}

	private parseValueProperty(
		line: string,
		phrase: string,
		prop: ItemValueProperty | undefined,
		numDecimals = 0
	): ItemValueProperty | undefined {
		const [text, augmented] = this.parsePhrase(line, phrase);
		if (!text) {
			return prop;
		}
		const property: ItemValueProperty = {
			augmented,
			value: ItemParserUtils.parseItemValue(text, numDecimals),
		};
		return property;
	}

	private parsePhrase(line: string, phrase: string): [string, boolean] {
		if (line.indexOf(phrase) !== 0) {
			return ['', false];
		}
		return this.parseText(line.slice(phrase.length));
	}

	private parseText(line: string): [string, boolean] {
		const max = this.clientString.translate('ItemDisplaySkillGemMaxLevel').replace('{0}', '');
		const augmented = line.indexOf(AUGMENTED_PHRASE) !== -1;
		const text = line.replace(max, '').replace(AUGMENTED_PHRASE, '');
		return [text, augmented];
	}

	private getPhrases(): string[] {
		return [
			`${this.clientString.translate('ItemDisplayWeaponPhysicalDamage')}: `,//0
			`${this.clientString.translate('ItemDisplayWeaponElementalDamage')}: `,//1
			`${this.clientString.translate('ItemDisplayWeaponChaosDamage')}: `,//2
			`${this.clientString.translate('ItemDisplayWeaponCriticalStrikeChance')}: `,//3
			`${this.clientString.translate('ItemDisplayWeaponAttacksPerSecond')}: `,//4
			`${this.clientString.translate('ItemDisplayWeaponRange')}: `,//5
			`${this.clientString.translate('ItemDisplayShieldBlockChance')}: `,//6
			`${this.clientString.translate('ItemDisplayArmourArmour')}: `,//7
			`${this.clientString.translate('ItemDisplayArmourEvasionRating')}: `,//8
			`${this.clientString.translate('ItemDisplayArmourEnergyShield')}: `,//9
			`${this.clientString.translate('ItemDisplayArmourSpirit')}: `,//10
			`${this.clientString.translate('ItemDisplayStackSize')}: `,//11
			`${this.clientString.translate('Level')}: `,//12
			`${this.clientString.translate('ItemDisplayMapTier')}: `,//13
			`${this.clientString.translate('ItemDisplayMapBonus')}: `,//14
			`${this.clientString.translate('Quality')}: `,//16
			`${this.clientString.translate('Quality1')}: `,//17
			`${this.clientString.translate('Quality2')}: `,//18
			`${this.clientString.translate('Quality3')}: `,//19
			`${this.clientString.translate('Quality4')}: `,//20
			`${this.clientString.translate('Quality5')}: `,//21
			`${this.clientString.translate('Quality6')}: `,//22
			`${this.clientString.translate('Quality7')}: `,//23
			`${this.clientString.translate('Quality8')}: `,//24
			`${this.clientString.translate('Quality9')}: `,//25
			`${this.clientString.translate('Quality10')}: `,//26
		];
	}
}
