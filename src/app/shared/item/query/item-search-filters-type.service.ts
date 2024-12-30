import { Injectable } from '@angular/core';
import { ItemService } from '@shared/item/service/item.service';
import { Item, ItemCategory, ItemRarity, ItemSearchFiltersService } from '@shared/item/type';
import { Query } from '@shared/poe-api';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSearchFiltersTypeService implements ItemSearchFiltersService {
	constructor(private readonly itemNameService: ItemService) { }

	public add(item: Item, language: Language, query: Query): void {
		query.filters!.type_filters = {
			filters: {},
		};

		const name = this.itemNameService.getName(item.nameId, language);
		if (name) {
			query.name = {
				option: name,
			};
		}

		const type = this.itemNameService.getType(item.typeId, language);
		if (type) {
			query.type = {
				option: type,
			};
		}

		switch (item.category) {
			case ItemCategory.Weapon: // weapon
			case ItemCategory.WeaponOneMelee:
			case ItemCategory.WeaponUnarmed:
			case ItemCategory.WeaponClaw:
			case ItemCategory.WeaponDagger:
			case ItemCategory.WeaponOneSword:
			case ItemCategory.WeaponOneAxe:
			case ItemCategory.WeaponOneMace:
			case ItemCategory.WeaponSpear:
			case ItemCategory.WeaponFlail:
			case ItemCategory.WeaponTwoMelee:
			case ItemCategory.WeaponTwoSword:
			case ItemCategory.WeaponTwoAxe:
			case ItemCategory.WeaponTwoMace:
			case ItemCategory.WeaponWarstaff:
			case ItemCategory.WeaponRanged:
			case ItemCategory.WeaponBow:
			case ItemCategory.WeaponCrossbow:
			case ItemCategory.WeaponCaster:
			case ItemCategory.WeaponWand:
			case ItemCategory.WeaponSceptre:
			case ItemCategory.WeaponStaff:
			case ItemCategory.WeaponRod:
			case ItemCategory.Armour: // armour
			case ItemCategory.ArmourChest:
			case ItemCategory.ArmourBoots:
			case ItemCategory.ArmourGloves:
			case ItemCategory.ArmourHelmet:
			case ItemCategory.ArmourShield:
			case ItemCategory.ArmourQuiver:
			case ItemCategory.Accessory: // accessory
			case ItemCategory.AccessoryAmulet:
			case ItemCategory.AccessoryBelt:
			case ItemCategory.AccessoryRing:
				switch (item.rarity) {
					case ItemRarity.Unique:
						query.filters!.type_filters.filters!.rarity = {
							option: item.rarity,
						};
						break;
					case ItemRarity.UniqueRelic:
						query.filters!.type_filters.filters!.rarity = {
							option: item.relic ? item.rarity : ItemRarity.Unique,
						};
						break;
					default:
						query.filters!.type_filters.filters!.rarity = {
							option: ItemRarity.NonUnique,
						};

						if (query.name) {
							query.term = `${query.name.option || ''} ${query.type!.option || ''}`.trim();
							query.name = query.type = undefined;
						}
						break;
				}
				query.filters!.type_filters.filters!.category = {
					option: item.category,
				};
				break;
			case ItemCategory.Jewel:
			case ItemCategory.Flask:
			case ItemCategory.Map:
				switch (item.rarity) {
					case ItemRarity.Unique:
						query.filters!.type_filters.filters!.rarity = {
							option: item.rarity,
						};
						break;
					case ItemRarity.UniqueRelic:
						query.filters!.type_filters.filters!.rarity = {
							option: item.relic ? item.rarity : ItemRarity.Unique,
						};
						break;
					default:
						query.filters!.type_filters.filters!.rarity = {
							option: ItemRarity.NonUnique,
						};
						break;
				}
				query.filters!.type_filters.filters!.category = {
					option: item.category,
				};
				break;
			// gem
			case ItemCategory.Gem:
			case ItemCategory.GemActiveGem:
			case ItemCategory.GemSupportGem:
				if (item.typeId?.startsWith("TransfiguredGem_")) {
					query.term = query.type!.option;
					query.type = undefined;
				}

				query.filters!.type_filters.filters!.category = {
					option: item.category,
				};
				break;
			case ItemCategory.Currency:
			case ItemCategory.CurrencyOmen:
			case ItemCategory.Card:
			case ItemCategory.SanctumRelic:
				query.filters!.type_filters.filters!.category = {
					option: item.category,
				};
				break;
			default:
				break;
		}
	}
}
