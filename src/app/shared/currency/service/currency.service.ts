import { Injectable } from '@angular/core';
import { CurrenciesProvider } from '@shared/currency/provider/currencies.provider';
import { Currency } from '@shared/currency/type';
import { TradeStaticResultId } from '@shared/poe-api';
import { ContextService } from '@shared/service';
import { Language } from '@shared/type';
import { Observable, map, mergeMap, of, shareReplay } from 'rxjs';

const CACHE_SIZE = 1;

@Injectable({
	providedIn: 'root',
})
export class CurrencyService {
	private cache$: Record<string, Observable<Currency | undefined>> = {};

	constructor(
		private readonly context: ContextService,
		private readonly currenciesProvider: CurrenciesProvider
	) { }

	public get(language?: Language): Observable<Currency[]> {
		language = language || this.context.get().language;

		return this.currenciesProvider.provide(language, TradeStaticResultId.Currency);
	}

	public searchById(
		id: string,
		searchLanguage?: Language,
		resultLanguage?: Language
	): Observable<Currency | undefined> {
		searchLanguage = searchLanguage || this.context.get().language;
		resultLanguage = resultLanguage || this.context.get().language;

		const key = this.getCacheKey(id, searchLanguage);
		if (!this.cache$[key]) {
			this.cache$[key] = this.searchByPredicate(searchLanguage, (x) => x.id === id).pipe(
				shareReplay(CACHE_SIZE)
			);
		}
		const result = this.cache$[key];
		if (searchLanguage === resultLanguage) {
			return result;
		}
		return result.pipe(mergeMap((currency) => {
			if (!currency) {
				return of(undefined);
			}
			return this.searchById(currency.id, resultLanguage);
		}));
	}

	public searchByNameType(
		nameType: string,
		searchLanguage?: Language,
		resultLanguage?: Language
	): Observable<Currency | undefined> {
		searchLanguage = searchLanguage || this.context.get().language;
		resultLanguage = resultLanguage || this.context.get().language;

		const key = this.getCacheKey(nameType, searchLanguage);
		if (!this.cache$[key]) {
			this.cache$[key] = this.searchByPredicate(
				searchLanguage,
				(x) => x.nameType === nameType
			).pipe(shareReplay(CACHE_SIZE));
		}
		const result = this.cache$[key];
		if (searchLanguage === resultLanguage) {
			return result;
		}
		return result.pipe(mergeMap((currency) => {
			if (!currency) {
				return of(undefined);
			}
			return this.searchById(currency.id, resultLanguage);
		}));
	}

	private getCacheKey(id: string, language: Language): string {
		return `${id}:${language}`;
	}

	private searchByPredicate(
		language: Language,
		predicate: (currency: Currency) => boolean
	): Observable<Currency | undefined> {
		return this.currenciesProvider
			.provide(language)
			.pipe(map((currencies) => currencies.find(predicate)));
	}
}
