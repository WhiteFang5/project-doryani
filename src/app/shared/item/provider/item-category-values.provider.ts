import { Injectable } from '@angular/core';
import { CacheService } from '@core/service';
import { ItemCategory, ItemCategoryValue, ItemCategoryValues, ItemRarity } from '@shared/item/type';
import { CurrencyOverviewHttpService, ItemOverviewHttpService } from '@shared/poe-ninja/service';
import { CurrencyOverviewType, ItemOverviewType } from '@shared/poe-ninja/type';
import { CacheExpirationType } from '@shared/type';
import { Observable, forkJoin, map, of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ItemCategoryValuesProvider {
	constructor(
		private readonly currencyService: CurrencyOverviewHttpService,
		private readonly itemService: ItemOverviewHttpService,
		private readonly cache: CacheService
	) { }

	public provide(
		leagueId: string,
		rarity: ItemRarity,
		category: ItemCategory,
	): Observable<ItemCategoryValues> {
		switch (category) {
			case ItemCategory.Map: {
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Map}_${ItemRarity.Unique}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueMap));
				} else {
					const key = `${leagueId}_${ItemCategory.Map}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Map));
				}
			}
			case ItemCategory.Card: {
				const key = `${leagueId}_${ItemCategory.Card}`;
				return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.DivinationCard));
			}
			case ItemCategory.Currency: {
				const key = `${leagueId}_${ItemCategory.Currency}`;
				return forkJoin([
					this.fetch(key, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Currency)),
					this.fetch(`${key}_essence`, () => this.fetchItem(leagueId, ItemOverviewType.Essence)),
					this.fetch(`${key}_artifact`, () => this.fetchItem(leagueId, ItemOverviewType.Artifact)),
					this.fetch(`${leagueId}_${ItemCategory.MapFragment}`, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Fragment)),
				]).pipe(
					map(([currencies, essences, artifacts, fragments]) => {
						return {
							values: [
								...currencies.values,
								...essences.values,
								...artifacts.values,
								...fragments.values,
							],
						};
					})
				);
			}
			case ItemCategory.MapFragment: {
				const key = `${leagueId}_${ItemCategory.MapFragment}`;
				return forkJoin([
					this.fetch(key, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Fragment)),
					this.fetch(`${leagueId}_${ItemCategory.Currency}`, () => this.fetchCurrency(leagueId, CurrencyOverviewType.Currency)),
				]).pipe(
					map(([fragments, currencies]) => {
						return {
							values: [
								...fragments.values,
								...currencies.values,
							],
						};
					})
				);
			}
			case ItemCategory.CurrencyOmen: {
				const key = `${leagueId}_${ItemCategory.CurrencyOmen}`;
				return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.Omen));
			}
			case ItemCategory.Jewel:
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Jewel}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueJewel));
				}
				return of({ values: [] });
			case ItemCategory.Flask:
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Flask}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueFlask));
				}
				return of({ values: [] });
			case ItemCategory.Weapon:
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
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Weapon}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueWeapon));
				}
				return of({ values: [] });
			case ItemCategory.Armour:
			case ItemCategory.ArmourChest:
			case ItemCategory.ArmourBoots:
			case ItemCategory.ArmourGloves:
			case ItemCategory.ArmourHelmet:
			case ItemCategory.ArmourShield:
			case ItemCategory.ArmourQuiver:
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Armour}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueArmour));
				}
				return of({ values: [] });
			case ItemCategory.Accessory:
			case ItemCategory.AccessoryAmulet:
			case ItemCategory.AccessoryBelt:
			case ItemCategory.AccessoryRing:
				if (rarity === ItemRarity.Unique || rarity === ItemRarity.UniqueRelic) {
					const key = `${leagueId}_${ItemCategory.Accessory}`;
					return this.fetch(key, () => this.fetchItem(leagueId, ItemOverviewType.UniqueAccessory));
				}
				return of({ values: [] });
			case ItemCategory.Gem:
			case ItemCategory.GemActiveGem:
			case ItemCategory.GemSupportGem:
				{
					const gemKey = `${leagueId}_${ItemCategory.Gem}`;
					return this.fetch(gemKey, () => this.fetchItem(leagueId, ItemOverviewType.SkillGem));
				}
			default:
				console.warn(`Missing ItemCategory case for '${category}'`);
				return of({ values: [] });
		}
	}

	private fetch(
		key: string,
		fetch: () => Observable<ItemCategoryValues>
	): Observable<ItemCategoryValues> {
		return this.cache.proxy(`item_category_${key}`, fetch, CacheExpirationType.HalfHour);
	}

	private fetchCurrency(
		leagueId: string,
		type: CurrencyOverviewType
	): Observable<ItemCategoryValues> {
		return this.currencyService.get(leagueId, type).pipe(
			map((response) => {
				const result: ItemCategoryValues = {
					values: response.lines.map((line) => {
						const sparkLine = line.receiveSparkLine || {
							data: [],
							totalChange: 0,
						};
						const value: ItemCategoryValue = {
							name: line.currencyTypeName,
							type: undefined,
							links: undefined,
							mapTier: undefined,
							levelRequired: undefined,
							gemLevel: undefined,
							gemQuality: undefined,
							corrupted: undefined,
							relic: undefined,
							change: sparkLine.totalChange,
							history: sparkLine.data,
							chaosAmount: line.chaosEquivalent,
							url: response.url,
						};
						return value;
					}),
				};
				if (type === CurrencyOverviewType.Currency) {
					// Explicitly add Chaos Orb to the list since this is the default exchange-currency (and thus not listed)
					const chaosOrb: ItemCategoryValue = {
						name: 'Chaos Orb',
						type: undefined,
						links: undefined,
						mapTier: undefined,
						levelRequired: undefined,
						gemLevel: undefined,
						gemQuality: undefined,
						corrupted: undefined,
						relic: undefined,
						change: 0,
						history: [],
						chaosAmount: 1,
						url: response.url,
					};
					result.values.push(chaosOrb);
				}
				return result;
			})
		);
	}

	private fetchItem(leagueId: string, type: ItemOverviewType): Observable<ItemCategoryValues> {
		return this.itemService.get(leagueId, type).pipe(
			map((response) => {
				const result: ItemCategoryValues = {
					values: response.lines.map((line) => {
						const sparkLine = line.sparkline || {
							data: [],
							totalChange: 0,
						};
						const value: ItemCategoryValue = {
							name: line.name,
							type: line.baseType,
							links: line.links,
							mapTier: line.mapTier,
							levelRequired: line.levelRequired,
							gemLevel: line.gemLevel,
							gemQuality: line.gemQuality,
							corrupted: line.corrupted,
							relic: line.itemClass === 9,
							change: sparkLine.totalChange,
							history: sparkLine.data,
							chaosAmount: line.chaosValue,
							url: response.url,
						};
						return value;
					}),
				};
				return result;
			})
		);
	}
}
