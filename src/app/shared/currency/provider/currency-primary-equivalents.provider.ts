import { Injectable } from '@angular/core';
import { CacheService } from '@core/service';
import { CurrencyPrimaryEquivalents } from '@shared/currency/type';
import { CurrencyOverviewHttpService } from '@shared/poe-ninja/service';
import { CurrencyOverviewType } from '@shared/poe-ninja/type';
import { CacheExpirationType } from '@shared/type';
import { Observable, map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class CurrencyPrimaryEquivalentsProvider {
	constructor(
		private readonly currencyOverviewHttpService: CurrencyOverviewHttpService,
		private readonly cache: CacheService
	) { }

	public provide(leagueId: string): Observable<CurrencyPrimaryEquivalents> {
		const key = `currency_primary_equivalents_${leagueId}`;
		return this.cache.proxy(key, () => this.fetch(leagueId), CacheExpirationType.HalfHour);
	}

	private fetch(leagueId: string): Observable<CurrencyPrimaryEquivalents> {
		return this.currencyOverviewHttpService
			.get(leagueId, CurrencyOverviewType.Currency)
			.pipe(
				map((response) => {
					const currencyPrimaryEquivalents: CurrencyPrimaryEquivalents = {};
					response.lines.forEach((line) => {
						currencyPrimaryEquivalents[line.currencyTypeName] = line.chaosEquivalent;
					});
					currencyPrimaryEquivalents['Exalted Orb'] = 1;
					return currencyPrimaryEquivalents;
				})
			);
	}
}
