import { Injectable } from '@angular/core';
import { MathUtils } from '@core/class/math-utils.class';
import { CacheService, LoggerService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import { ItemSearchIndexed, ItemSearchOptions } from '@feature/evaluate/type';
import { CurrencyService } from '@shared/currency/service/currency.service';
import { Currency } from '@shared/currency/type';
import { ItemParserUtils } from '@shared/item/parser/item-parser.utils';
import { ItemSearchQueryService } from '@shared/item/query/item-search-query.service';
import { ExchangeSearchResult, Item, ItemCategory, ItemSearchListing, ItemSearchResult, TradeSearchResult } from '@shared/item/type';
import { ExchangeEngine, ExchangeFetchResult, ExchangeSearchRequest, PoEHttpService, TradeFetchResult, TradeResponse, TradeSearchRequest } from '@shared/poe-api';
import { BaseItemTypesService, ContextService } from '@shared/service';
import { forkJoin, from, Observable, of, catchError, mergeMap, map, toArray } from 'rxjs';

const MAX_FETCH_PER_REQUEST_COUNT = 10;
const CACHE_EXPIRY = 1000 * 60 * 10;

@Injectable({
	providedIn: 'root',
})
export class ItemSearchService {
	constructor(
		private readonly context: ContextService,
		private readonly currencyService: CurrencyService,
		private readonly baseItemTypesServices: BaseItemTypesService,
		private readonly requestService: ItemSearchQueryService,
		private readonly poeHttpService: PoEHttpService,
		private readonly cache: CacheService,
		private readonly logger: LoggerService
	) { }

	public searchOrExchange(
		requestedItem: Item,
		options?: ItemSearchOptions,
		currency?: Currency
	): Observable<ItemSearchResult> {
		options = options || {};
		options.leagueId = options.leagueId || this.context.get().leagueId;
		options.language = options.language || this.context.get().language;

		switch (requestedItem.category) {
			case ItemCategory.Currency:
			case ItemCategory.MapFragment:
			case ItemCategory.Card:
				if (currency && requestedItem.stats?.length === 0) {
					return this.exchange(requestedItem, options, currency);
				}
				break;
		}
		return this.search(requestedItem, options);
	}

	public listTradeSearch(search: TradeSearchResult, fetchCount: number): Observable<ItemSearchListing[]> {
		const { id, language, hits } = search;

		const maxFetchCount = Math.min(fetchCount, hits.length);
		const maxHits = hits.slice(0, maxFetchCount);
		if (maxHits.length <= 0) {
			return of([]);
		}

		// check cache for values of items about to be searched
		const retrievedHits$ = maxHits.map((hit) => {
			const key = `item_listing_${language}_${hit}`;
			return this.cache.retrieve<TradeFetchResult>(key).pipe(
				map((value) => {
					// value will be null or undefined if not in cache
					return { id: hit, value };
				})
			);
		});

		return this.cache.prune('item_listing_').pipe(
			mergeMap(() => forkJoin(retrievedHits$)),
			mergeMap((retrievedHits) => {
				const hitsChunked: string[][] = [];

				const hitsMissing = retrievedHits.filter((x) => !x.value).map((x) => x.id);
				const hitsCached = retrievedHits.map((x) => x.value).filter((x): x is TradeFetchResult => !!x);

				this.logger.debug('',
					`missing hits: ${hitsMissing.length}, cached hits: ${hitsCached.length}` +
					` - saved: ${Math.round((hitsCached.length / maxHits.length) * 100)}%`
				);

				for (let i = 0; i < hitsMissing.length; i += MAX_FETCH_PER_REQUEST_COUNT) {
					hitsChunked.push(hitsMissing.slice(i, i + MAX_FETCH_PER_REQUEST_COUNT));
				}

				return from(hitsChunked).pipe(
					mergeMap((chunk) => this.poeHttpService.fetch(chunk, id, language)),
					toArray(),
					mergeMap((responses) => {
						const results: TradeFetchResult[] = responses
							.filter((x): x is TradeResponse<TradeFetchResult> => !!x)
							.reduce((a, b) => a.concat(b.result), hitsCached);

						if (results.length <= 0) {
							return of([]);
						}

						const listings$ = results.map((result) => {
							const key = `item_listing_${language}_${result.id}`;
							return this.cache
								.store(key, result, CACHE_EXPIRY, false)
								.pipe(mergeMap(() => this.mapTradeFetchResult(result)));
						});

						return forkJoin(listings$).pipe(
							map((listings) => listings.filter((x): x is ItemSearchListing => !!x))
						);
					})
				);
			})
		);
	}

	public listExchangeSearch(search: ExchangeSearchResult, fetchCount: number): Observable<ItemSearchListing[]> {
		const { language } = search;
		const hits = Object.keys(search.hits);

		const maxFetchCount = Math.min(fetchCount, hits.length);
		const maxHits = hits.slice(0, maxFetchCount);
		if (maxHits.length <= 0) {
			return of([]);
		}

		// check cache for values of items about to be searched
		const retrievedHits$ = maxHits.map((hit) => {
			const key = `item_listing_${language}_${hit}`;
			return this.cache.retrieve<ExchangeFetchResult>(key).pipe(
				map((value) => {
					// value will be null or undefined if not in cache
					return { id: hit, value };
				})
			);
		});

		return this.cache.prune('item_listing_').pipe(
			mergeMap(() => forkJoin(retrievedHits$)),
			mergeMap((retrievedHits) => {
				const hitsMissing = retrievedHits.filter((x) => !x.value);
				const hitsCached = retrievedHits.filter((x) => x.value);

				this.logger.debug('',
					`missing hits: ${hitsMissing.length}, cached hits: ${hitsCached.length}` +
					` - saved: ${Math.round((hitsCached.length / maxHits.length) * 100)}%`
				);

				const listings$ = retrievedHits.map((result) => {
					const key = `item_listing_${language}_${result.id}`;
					if (!result.value) {
						result.value = search.hits[result.id];
					}
					return this.cache
						.store(key, result.value, CACHE_EXPIRY, false)
						.pipe(mergeMap(() => this.mapExchangeFetchResult(result.value!)));
				});

				return forkJoin(listings$).pipe(
					map((listings) => listings.filter((x): x is ItemSearchListing => !!x))
				);
			})
		);
	}

	private search(requestedItem: Item, options: ItemSearchOptions): Observable<TradeSearchResult> {
		const request: TradeSearchRequest = {
			sort: {
				price: 'asc',
			},
			query: {
				status: {
					option: options.online ? 'online' : 'any',
				},
				filters: {
					trade_filters: {
						filters: {
							sale_type: {
								option: 'priced',
							},
						},
					},
				},
				stats: [],
			},
		};

		const { indexed } = options;
		if (indexed && indexed !== ItemSearchIndexed.AnyTime) {
			request.query.filters!.trade_filters!.filters!.indexed = {
				option: indexed,
			};
		}

		const { language, leagueId } = options;
		this.requestService.map(requestedItem, language!, request.query);

		return this.poeHttpService.search(request, language!, leagueId!).pipe(
			map((response) => {
				const { id, url, total } = response;
				const result: TradeSearchResult = {
					searchType: response.searchType,
					id,
					language: language!,
					url,
					total,
					hits: response.result || [],
				};
				return result;
			})
		);
	}

	private exchange(
		requestedItem: Item,
		options: ItemSearchOptions,
		currency: Currency
	): Observable<ItemSearchResult> {
		const { online, language, leagueId } = options;

		return this.currencyService
			.searchByNameType(
				this.baseItemTypesServices.translate(requestedItem.typeId, language),
				language
			)
			.pipe(
				mergeMap((requestedCurrency) => {
					// Fall-back to normal search when the requested currency can't be found or is invalid
					if (!requestedCurrency) {
						return this.search(requestedItem, options);
					}

					const request: ExchangeSearchRequest = {
						engine: ExchangeEngine.New,
						exchange: {
							status: {
								option: online ? 'online' : 'any',
							},
							want: [requestedCurrency.id],
							have: [currency.id],
						},
					};

					return this.poeHttpService.exchange(request, language!, leagueId!).pipe(
						map((response) => {
							const { id, url, total } = response;
							const result: ExchangeSearchResult = {
								searchType: response.searchType,
								id,
								language: language!,
								url,
								total,
								hits: response.result || {},
							};
							return result;
						}),
						catchError(err => {
							if (!APP_CONFIG.production) {
								console.log(`Failed to retrieve BulkExchange result for '${requestedCurrency.nameType}' Error:`);
								console.log(err);
							}
							return this.search(requestedItem, options);
						})
					);
				})
			);
	}

	private mapTradeFetchResult(result: TradeFetchResult): Observable<ItemSearchListing | undefined> {
		if (
			!result ||
			!result.listing ||
			!result.listing.price ||
			!result.listing.account ||
			!result.listing.indexed
		) {
			this.logger.warn(`Result was invalid.`, result);
			return of(undefined);
		}

		const { listing, item } = result;

		const indexed = new Date(listing.indexed);

		const seller = listing.account.name || '';
		if (seller.length <= 0) {
			this.logger.warn(`Seller: '${seller}' was empty or undefined.`);
			return of(undefined);
		}

		const { price } = listing;
		const { amount } = price;
		if (amount <= 0) {
			this.logger.warn(`Amount was less or equal zero. Seller: ${seller}`);
			return of(undefined);
		}

		let priceNumerator = amount;
		let priceDenominator = 1;

		const { note } = item;
		const notePrice = note?.replace(price.type, '').replace(price.currency, '').trim();
		if (notePrice) {
			if (notePrice.indexOf('/') !== -1) {
				const priceFraction = notePrice.split('/') || [];
				if (priceFraction.length === 2) {
					priceNumerator = ItemParserUtils.parseNumber(priceFraction[0]);
					priceDenominator = ItemParserUtils.parseNumber(priceFraction[1]);
				}
			} else if (notePrice.indexOf('.') !== -1 || notePrice.indexOf(',') !== -1) {
				priceNumerator = ItemParserUtils.parseDecimalNumber(notePrice, notePrice.split(/[.,]+/)[1].length);
			}
		}

		const currencyId = price.currency;
		return this.currencyService.searchById(currencyId).pipe(
			map((currency) => {
				if (!currency) {
					this.logger.warn(`Could not parse '${currencyId}' as currency.`);
					return undefined;
				}
				const result: ItemSearchListing = {
					seller,
					indexed,
					currency,
					amount,
					//TODO: Use moment again?
					age: `${Math.floor((Date.now().valueOf() - indexed.valueOf()) / 3600)}`,
					priceNumerator,
					priceDenominator,
				};
				return result;
			})
		);
	}

	private mapExchangeFetchResult(result: ExchangeFetchResult): Observable<ItemSearchListing | undefined> {
		if (
			!result ||
			!result.id ||
			!result.listing ||
			!result.listing.account ||
			!result.listing.indexed ||
			!result.listing.offers ||
			result.listing.offers.length === 0 ||
			!result.listing.offers.some(x => x.item.id === result.id)
		) {
			this.logger.warn(`Result was invalid.`, result);
			return of(undefined);
		}

		const { id, listing } = result;
		const offer = listing.offers.find(x => x.item.id === id);

		if (!offer) {
			this.logger.warn(`Id: '${id}' was empty or undefined.`);
			return of(undefined);
		}

		const indexed = new Date(listing.indexed);

		const seller = listing.account.name || '';
		if (seller.length <= 0) {
			this.logger.warn(`Seller: '${seller}' was empty or undefined.`);
			return of(undefined);
		}

		const { currency, amount } = offer.exchange;

		const priceNumerator = amount;
		const priceDenominator = offer.item.amount;

		if (priceNumerator <= 0) {
			this.logger.warn(`Exchange amount was less or equal zero. Seller: ${seller}`);
			return of(undefined);
		}

		if (priceDenominator <= 0) {
			this.logger.warn(`Offer Amount was less or equal zero. Seller: ${seller}`);
			return of(undefined);
		}

		return this.currencyService.searchById(currency).pipe(
			map((currency) => {
				if (!currency) {
					this.logger.warn(`Could not parse '${currency}' as currency.`);
					return undefined;
				}
				const result: ItemSearchListing = {
					seller,
					indexed,
					currency,
					amount: MathUtils.floor((priceNumerator / priceDenominator), MathUtils.significantDecimalCount(priceNumerator, priceDenominator)),
					//TODO: Use moment again?
					age: `${Math.floor((Date.now().valueOf() - indexed.valueOf()) / 3600)}`,
					priceNumerator,
					priceDenominator,
				};
				return result;
			})
		);
	}
}
