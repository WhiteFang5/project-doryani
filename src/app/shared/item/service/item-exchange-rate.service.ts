import { Injectable } from '@angular/core';
import { CurrencyConverterService } from '@shared/currency/service/currency-converter.service';
import { CurrencySelectService } from '@shared/currency/service/currency-select.service';
import { Currency, CurrencySelectStrategy } from '@shared/currency/type';
import { ItemCategoryValuesProvider } from '@shared/item/provider/item-category-values.provider';
import { ItemSocketService } from '@shared/item/service/item-socket.service';
import { Item, ItemCategory, ItemCategoryValue, ItemExchangeRateResult } from '@shared/item/type';
import { BaseItemTypesService, ClientStringService, ContextService, WordService } from '@shared/service';
import { Language } from '@shared/type';
import { Observable, forkJoin, iif, map, mergeMap, of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ItemExchangeRateService {
	constructor(
		private readonly context: ContextService,
		private readonly valuesProvider: ItemCategoryValuesProvider,
		private readonly socket: ItemSocketService,
		private readonly currencyConverterService: CurrencyConverterService,
		private readonly currencySelectService: CurrencySelectService,
		private readonly baseItemTypesService: BaseItemTypesService,
		private readonly wordService: WordService,
		private readonly clientString: ClientStringService,
	) { }

	public get(
		item: Item,
		currencies: Currency[],
		leagueId?: string
	): Observable<ItemExchangeRateResult | undefined> {
		leagueId = leagueId || this.context.get().leagueId;

		return this.getValue(leagueId!, item).pipe(
			mergeMap((value) =>
				iif(
					() => !value,
					of(undefined),
					forkJoin(
						currencies.map((currency) =>
							this.currencyConverterService.convert('exalted', currency.id)
						)
					).pipe(
						map((factors) => {
							const values = factors.filter((x) => x).map((factor) => [value.chaosAmount * factor!]);
							const index = this.currencySelectService.select(
								values,
								CurrencySelectStrategy.MinWithAtleast1
							);
							const size = item.properties?.stackSize?.value?.min || 1;
							const result: ItemExchangeRateResult = {
								amount: values[index][0],
								factor: size,
								inverseAmount: 1 / values[index][0],
								currency: currencies[index],
								change: value.change,
								history: value.history || [],
								url: value.url,
							};
							return result;
						})
					)
				)
			)
		);
	}

	private getValue(leagueId: string, item: Item): Observable<ItemCategoryValue> {
		const links = this.socket.getLinkCount(item.sockets);
		const filterLinks = (x: ItemCategoryValue) => {
			if (x.links === undefined) {
				return true;
			}
			if (links > 4) {
				return x.links === links;
			}
			if (links >= 0) {
				return x.links === 0;
			}
			return false;
		};

		const tier = item.properties?.mapTier?.value?.value;
		const filterMapTier = (x: ItemCategoryValue) => {
			if (tier === undefined || isNaN(tier) || x.mapTier === undefined) {
				return true;
			}
			return x.mapTier === tier;
		};

		const gemLevel = item.properties?.gemLevel?.value?.value;
		const filterGemLevel = (x: ItemCategoryValue) => {
			if (gemLevel === undefined || isNaN(gemLevel) || x.gemLevel === undefined) {
				switch (item.category) {
					case ItemCategory.Gem:
					case ItemCategory.GemActiveGem:
					case ItemCategory.GemSupportGem:
						return false;
				}
				return true;
			}
			return x.gemLevel === gemLevel;
		};

		const gemQuality = item.properties?.quality?.value?.value;
		const filterGemQuality = (x: ItemCategoryValue) => {
			if (gemQuality === undefined || isNaN(gemQuality) || x.gemQuality === undefined) {
				switch (item.category) {
					case ItemCategory.Gem:
					case ItemCategory.GemActiveGem:
					case ItemCategory.GemSupportGem:
						return false;
				}
				return true;
			}
			return x.gemQuality === gemQuality;
		};

		const corrupted = item.corrupted === true;
		const filterCorruption = (x: ItemCategoryValue) => {
			if (!!corrupted || !!x.corrupted) {
				switch (item.category) {
					case ItemCategory.Gem:
					case ItemCategory.GemActiveGem:
					case ItemCategory.GemSupportGem:
						return false;
				}
				return true;
			}
			return x.corrupted === corrupted;
		};

		const itemLevel = item.level?.value;
		const filterItemLevel = (x: ItemCategoryValue) => {
			if (itemLevel === undefined || x.levelRequired === undefined) {
				return true;
			}
			return x.levelRequired <= itemLevel;
		};

		const filterName = (x: ItemCategoryValue, name: string) => {
			switch (item.category) {
				case ItemCategory.Gem:
				case ItemCategory.GemActiveGem:
				case ItemCategory.GemSupportGem:
					if (item.properties?.gemQualityType) {
						name = this.clientString
							.translate('GemAlternateQuality' + item.properties.gemQualityType + 'Affix')
							.replace('{0}', name);
					}
					break;
			}
			return x.name === name;
		};

		return this.valuesProvider.provide(leagueId, item.rarity!, item.category!).pipe(
			map((response) => {
				const type = this.baseItemTypesService.translate(item.typeId, Language.English);
				const name = this.wordService.translate(item.nameId, Language.English);
				let results = response.values;
				// Filter based on item type or name
				if (item.typeId && !item.nameId) {
					results = results.filter((x) => filterName(x, type));
				} else {
					results = results.filter(
						(x) =>
							filterName(x, name) &&
							x.type === type &&
							((!item.relic && !x.relic) || x.relic === item.relic)
					);
				}
				// Apply generic filters
				results = results.filter(
					(x) =>
						filterLinks(x) &&
						filterMapTier(x) &&
						filterGemLevel(x) &&
						filterGemQuality(x) &&
						filterCorruption(x) &&
						filterItemLevel(x)
				);
				return results[0];
			})
		);
	}
}
