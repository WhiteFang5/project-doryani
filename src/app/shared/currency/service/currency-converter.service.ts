import { Injectable } from '@angular/core';
import { CurrencyPrimaryEquivalentsService } from '@shared/currency/service/currency-primary-equivalents.service';
import { Currency } from '@shared/currency/type';
import { ContextService } from '@shared/service';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';

interface CacheEntry {
	expiry: number;
	value: Observable<number | undefined>;
}

const CACHE_SIZE = 1;
const CACHE_EXPIRY = 1000 * 60 * 5;

@Injectable({
	providedIn: 'root',
})
export class CurrencyConverterService {
	private cache: Record<string, CacheEntry> = {};

	constructor(
		private readonly currencyPrimaryEquivalentsService: CurrencyPrimaryEquivalentsService,
		private readonly contextService: ContextService
	) { }

	public convert(
		currencyOrId: Currency | string,
		targetCurrencyOrId: Currency | string,
		leagueId?: string
	): Observable<number | undefined> {
		leagueId = leagueId || this.contextService.get().leagueId;

		const currencyId = (currencyOrId as Currency).id || (currencyOrId as string);
		const targetCurrencyId = (targetCurrencyOrId as Currency).id || (targetCurrencyOrId as string);

		const now = Date.now();
		const cacheKey = `${currencyId}:${targetCurrencyId}:${leagueId}`;
		if (!this.cache[cacheKey] || now > this.cache[cacheKey].expiry) {
			this.cache[cacheKey] = {
				expiry: now + CACHE_EXPIRY,
				value: this.calculateFactor(currencyId, leagueId!, targetCurrencyId).pipe(
					shareReplay(CACHE_SIZE)
				),
			};
		}
		return this.cache[cacheKey].value;
	}

	private calculateFactor(
		currencyId: string,
		leagueId: string,
		targetCurrencyId: string
	): Observable<number | undefined> {
		return forkJoin([
			this.currencyPrimaryEquivalentsService.getById(currencyId, leagueId),
			this.currencyPrimaryEquivalentsService.getById(targetCurrencyId, leagueId),
		]).pipe(
			map((primaryEquivalents) => {
				if (!primaryEquivalents[0]) {
					return undefined;
				}
				if (targetCurrencyId === 'exalted') {
					return primaryEquivalents[0];
				}
				if (!primaryEquivalents[1]) {
					return undefined;
				}
				return primaryEquivalents[0] / primaryEquivalents[1];
			})
		);
	}
}
