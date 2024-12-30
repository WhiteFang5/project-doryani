import { Injectable } from '@angular/core';
import { CacheService } from '@core/service';
import { Currency } from '@shared/currency/type';
import { PoEHttpService, TradeStaticResultId } from '@shared/poe-api';
import { CacheExpirationType, Language } from '@shared/type';
import { Observable, map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class CurrenciesProvider {
	constructor(
		private readonly poeHttpService: PoEHttpService,
		private readonly cache: CacheService
	) { }

	public provide(language: Language, groupId?: TradeStaticResultId): Observable<Currency[]> {
		const groupKey = groupId?.toLowerCase() || 'all';
		const key = `${groupKey}_${language}`;
		return this.cache.proxy(key, () => this.fetch(language, groupId), CacheExpirationType.OneHour);
	}

	private fetch(language: Language, groupId?: TradeStaticResultId): Observable<Currency[]> {
		return this.poeHttpService.getStatic(language).pipe(
			map((response) => {
				let result = response.result;
				if (groupId) {
					result = result.filter((group) => group.id === groupId);
				}
				const currencies: Currency[] = [];
				currencies.concat(
					...result.map((group) =>
						group.entries.map((entry) => {
							const currency: Currency = {
								id: entry.id,
								nameType: entry.text,
								image: entry.image,
							};
							return currency;
						})
					)
				);
				return currencies;
			})
		);
	}
}
