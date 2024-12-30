import { Injectable } from '@angular/core';
import { CurrencyPrimaryEquivalentsProvider } from '@shared/currency/provider/currency-primary-equivalents.provider';
import { CurrencyService } from '@shared/currency/service/currency.service';
import { Currency } from '@shared/currency/type';
import { ContextService } from '@shared/service';
import { Language } from '@shared/type';
import { Observable, map, mergeMap, of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class CurrencyPrimaryEquivalentsService {
	constructor(
		private readonly currencyPrimaryEquivalentsProvider: CurrencyPrimaryEquivalentsProvider,
		private readonly currencyService: CurrencyService,
		private readonly context: ContextService
	) { }

	public get(currency: Currency, leagueId?: string): Observable<number | undefined> {
		return this.getById(currency.id, leagueId);
	}

	public getById(currencyId: string, leagueId?: string): Observable<number | undefined> {
		leagueId = leagueId || this.context.get().leagueId;

		return this.currencyService.searchById(currencyId, Language.English).pipe(
			mergeMap((englishCurrency) => {
				if (!englishCurrency) {
					return of(undefined);
				}
				return this.currencyPrimaryEquivalentsProvider
					.provide(leagueId!)
					.pipe(map((values) => values[englishCurrency.nameType]));
			})
		);
	}
}
