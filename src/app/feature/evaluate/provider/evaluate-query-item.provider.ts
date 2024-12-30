import { Injectable } from '@angular/core';
import { EvaluateQueryItemResult, EvaluateUserSettings } from '@feature/evaluate/type';
import { ItemSocketService } from '@shared/item/service/item-socket.service';
import { Item, ItemCategory, ItemRarity, ItemSocketColor, ItemStat } from '@shared/item/type';
import { StatType } from '@shared/stats/type';

@Injectable({
	providedIn: 'root',
})
export class EvaluateQueryItemProvider {
	constructor(
		private readonly itemSocketService: ItemSocketService,
	) { }

	public provide(item: Item, settings: EvaluateUserSettings): EvaluateQueryItemResult {
		const defaultItem: Item = this.copy({
			nameId: item.nameId,
			typeId: item.typeId,
			category: item.category,
			rarity: item.rarity,
			corrupted: item.corrupted,
			// Don't copy mirrored; doing so will auto-select it and narrow the search too much
			unmodifiable: item.unmodifiable,
			unidentified: item.unidentified,
			relic: item.relic,
			damage: {},
			stats: [],
			properties: {
				qualityType: (item.properties || {}).qualityType,
			},
			requirements: {},
			sockets: new Array((item.sockets || []).length).fill({}),
		});
		const queryItem = this.copy(defaultItem);

		// Deselect the item type/name since 'quest' items can't be sold, but in case of sextants they can be extracted to a different item type/name
		if (queryItem.rarity === ItemRarity.Quest) {
			queryItem.typeId = queryItem.nameId = undefined;
		}

		if (settings.evaluateQueryDefaultItemLevel && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic && queryItem.rarity !== ItemRarity.Quest) {
			queryItem.level = item.level;
		}

		const count = this.itemSocketService.getLinkCount(item.sockets);
		if (count >= settings.evaluateQueryDefaultLinks && item.sockets && queryItem.sockets) {
			item.sockets.forEach((socket, index) => {
				queryItem.sockets![index].linked = socket.linked;
			});
		}

		if (item.sockets && item.sockets.length >= settings.evaluateQueryDefaultColors) {
			item.sockets.forEach((socket, index) => {
				let newColor: ItemSocketColor | undefined = ItemSocketColor.Any;
				if (item.corrupted) {
					newColor = socket.color;
				}
				queryItem.sockets![index].color = newColor;
			});
		}

		if (settings.evaluateQueryDefaultMiscs) {
			const prop = item.properties;
			if (prop && queryItem.properties) {
				queryItem.properties.gemLevel = prop.gemLevel;
				queryItem.properties.gemQualityType = prop.gemQualityType;
				queryItem.properties.mapTier = prop.mapTier;
				queryItem.properties.areaLevel = prop.areaLevel;
				if (item.rarity === ItemRarity.Gem || (prop.qualityType && prop.qualityType > 0)) {
					queryItem.properties.quality = prop.quality;
				}
			}
		}

		if (settings.evaluateQueryDefaultAttack && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic) {
			queryItem.damage = item.damage;

			const prop = item.properties;
			if (prop && queryItem.properties && item.category && item.category.startsWith(ItemCategory.Weapon)) {
				queryItem.properties.weaponAttacksPerSecond = prop.weaponAttacksPerSecond;
				queryItem.properties.weaponCriticalStrikeChance = prop.weaponCriticalStrikeChance;
			}
		}

		if (settings.evaluateQueryDefaultDefense && queryItem.rarity !== ItemRarity.Unique && queryItem.rarity !== ItemRarity.UniqueRelic) {
			const prop = item.properties;
			if (prop && queryItem.properties && item.category && item.category.startsWith(ItemCategory.Armour)) {
				queryItem.properties.armourArmour = prop.armourArmour;
				queryItem.properties.armourEvasionRating = prop.armourEvasionRating;
				queryItem.properties.armourEnergyShield = prop.armourEnergyShield;
				queryItem.properties.armourSpirit = prop.armourSpirit;
				queryItem.properties.shieldBlockChance = prop.shieldBlockChance;
			}
		}

		if (!settings.evaluateQueryDefaultType) {
			if (
				item.rarity === ItemRarity.Normal ||
				item.rarity === ItemRarity.Magic ||
				item.rarity === ItemRarity.Rare
			) {
				if (item.category && (
					item.category.startsWith(ItemCategory.Weapon) ||
					item.category.startsWith(ItemCategory.Armour) ||
					item.category.startsWith(ItemCategory.Accessory))
				) {
					queryItem.typeId = queryItem.nameId = undefined;
				}
			}
		}

		if (item.stats && queryItem.stats) {
			if (
				(item.rarity === ItemRarity.Unique || item.rarity === ItemRarity.UniqueRelic) &&
				settings.evaluateQueryDefaultStatsUnique
			) {
				// Select all stats if it's corrupted, mirrored or unmodifiable, otherwise exclude implicit stats
				queryItem.stats = item.stats.map((stat) => {
					if (!this.isExcludedUniqueStat(stat) && (item.corrupted || item.mirrored || item.unmodifiable || !this.isRelatedToAnImplicitStat(stat))) {
						return stat;
					}
					return undefined;
				}).filter((x): x is ItemStat => !!x);
			} else {
				queryItem.stats = item.stats.map((stat) => {
					// Auto-select enchanted stats or stats with a mod icon
					if (stat.type === StatType.Enchant && settings.evaluateQueryDefaultStatsEnchants) {
						return stat;
					}
					const key = `${stat.type}.${stat.tradeId}`;
					return settings.evaluateQueryDefaultStats[key] ? stat : undefined;
				}).filter((x): x is ItemStat => !!x);
			}
		}

		return {
			defaultItem: this.copy(defaultItem),
			queryItem: this.copy(queryItem),
		};
	}

	private copy(item: Item): Item {
		return JSON.parse(JSON.stringify(item));
	}

	private isRelatedToAnImplicitStat(stat: ItemStat): boolean {
		return stat.type === StatType.Implicit || (stat.relatedStats?.some(s => this.isRelatedToAnImplicitStat(s)) ?? false);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private isExcludedUniqueStat(stat: ItemStat): boolean {
		return false;
	}
}
