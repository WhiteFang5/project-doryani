import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ofType } from '@core/function';
import { BrowserService, LoggerService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import { EvaluateSearchChartComponent } from '@feature/evaluate/component/evaluate-search-chart/evaluate-search-chart.component';
import { EvaluateSearchTableComponent } from '@feature/evaluate/component/evaluate-search-table/evaluate-search-table.component';
import { EVALUATE_QUERY_DEBOUNCE_TIME_MAX, EvaluateOptions, EvaluateResult, EvaluateResultView, EvaluateUserSettings, ItemSearchOptions } from '@feature/evaluate/type';
import { CurrencyFrameComponent } from '@shared/currency/component/currency-frame/currency-frame.component';
import { Currency } from '@shared/currency/type';
import { ItemSearchAnalyzeService } from '@shared/item/service/item-search-analyze.service';
import { ItemSearchService } from '@shared/item/service/item-search.service';
import { ExchangeSearchResult, Item, ItemSearchAnalyzeResult, ItemSearchListing, ItemSearchResult, TradeSearchResult } from '@shared/item/type';
import { TradeSearchType } from '@shared/poe-api';
import { SharedModule } from '@shared/shared.module';
import { BehaviorSubject, Subject, Subscription, timer, debounceTime, takeUntil } from 'rxjs';

@Component({
	selector: 'app-evaluate-search',
	templateUrl: './evaluate-search.component.html',
	styleUrls: ['./evaluate-search.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		CurrencyFrameComponent,
		EvaluateSearchChartComponent,
		EvaluateSearchTableComponent,
	],
})
export class EvaluateSearchComponent implements OnInit, OnDestroy {
	private searchSubscription?: Subscription;
	private listSubscription?: Subscription;
	private analyzeSubscription?: Subscription;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private lastError?: any;

	public graph = false;

	public search$ = new BehaviorSubject<ItemSearchResult | undefined>(undefined);
	public searched$ = new BehaviorSubject<boolean>(false);
	public count$ = new BehaviorSubject<number>(0);
	public listings$ = new BehaviorSubject<ItemSearchListing[] | undefined>(undefined);
	public result$ = new BehaviorSubject<ItemSearchAnalyzeResult | undefined>(undefined);
	public error$ = new BehaviorSubject<string | undefined>(undefined);
	public staleCounter$ = new BehaviorSubject<number>(0);
	public staleProgress$ = new BehaviorSubject<number>(0);

	@Input()
	public options!: EvaluateOptions;

	@Input()
	public settings!: EvaluateUserSettings;

	@Input()
	public queryItem!: Item;

	@Input()
	public queryItemChange!: Subject<Item>;

	@Input()
	public currencies!: Currency[];

	@Output()
	public evaluateResult = new EventEmitter<EvaluateResult>();

	constructor(
		private readonly itemSearchService: ItemSearchService,
		private readonly itemSearchAnalyzeService: ItemSearchAnalyzeService,
		private readonly browser: BrowserService,
		private readonly logger: LoggerService,
	) { }

	public ngOnInit(): void {
		this.graph = this.settings.evaluateResultView === EvaluateResultView.Graph;
		if (this.settings.evaluateQueryInitialSearch) {
			this.initSearch();
		}
	}

	public ngOnDestroy(): void {
		this.searchSubscription?.unsubscribe();
		this.listSubscription?.unsubscribe();
		this.analyzeSubscription?.unsubscribe();
	}

	public onSearchClick(): void {
		this.initSearch();
	}

	public onRetryClick(): void {
		this.clear();
		this.search(this.queryItem);
	}

	public onCurrencyClick(event: MouseEvent): void {
		const search = this.search$.value;
		if (search?.url?.length) {
			this.browser.open(
				search.url,
				this.settings.evaluateBrowserAlwaysExternal ? true : event.ctrlKey
			);
		} else if (this.lastError?.browserUrl?.length) {
			this.browser.open(
				this.lastError.browserUrl,
				this.settings.evaluateBrowserAlwaysExternal ? true : event.ctrlKey
			);
		}
	}

	public onSearchCancelClick(): void {
		this.listings$.next([]);
		this.listSubscription?.unsubscribe();
	}

	public onStaleCancelClick(): void {
		this.staleCounter$.next(0);
	}

	public onCurrencyWheel(event: WheelEvent): void {
		const listings = this.listings$.value;
		if (!listings?.length) {
			return;
		}

		const factor = event.deltaY > 0 ? -1 : 1;
		let index = this.currencies.findIndex((x) => x.id === this.result$.value?.currency?.id);
		index += factor;
		if (index >= this.currencies.length) {
			index = 0;
		} else if (index < 0) {
			index = this.currencies.length - 1;
		}

		const search = this.search$.value;
		if (search?.searchType === TradeSearchType.BulkExchange) {
			this.clear();
			this.search(this.queryItem, this.currencies[index]);
		} else {
			this.result$.next(undefined);
			this.analyze(listings, this.currencies[index]);
		}
	}

	public onAmountSelect(amount: number, currency?: Currency): void {
		currency = currency || this.result$.value?.currency;
		if (!currency) {
			return;
		}
		this.evaluateResult.next({ amount, currency });
	}

	public canOpenInBrowser(): boolean {
		return (this.search$.value?.url.length || 0) > 0 || this.lastError?.browserUrl?.length > 0;
	}

	public useWideViewport(): boolean {
		return this.search$.value?.searchType === TradeSearchType.BulkExchange;
	}

	private initSearch(): void {
		this.search(this.queryItem);
		this.registerSearchOnChange();
	}

	private registerSearchOnChange(): void {
		let subscription: Subscription;
		this.queryItemChange.pipe(debounceTime(100)).subscribe((item) => {
			this.clear();
			this.staleCounter$.next(this.settings.evaluateQueryDebounceTime);
			this.staleProgress$.next(100);
			subscription?.unsubscribe();
			subscription = timer(0, 100)
				.pipe(takeUntil(this.queryItemChange))
				.subscribe(() => {
					if (this.staleCounter$.value === 0) {
						subscription?.unsubscribe();
						this.search(item);
					} else {
						if (this.settings.evaluateQueryDebounceTime !== EVALUATE_QUERY_DEBOUNCE_TIME_MAX) {
							this.staleCounter$.next(this.staleCounter$.value - 1);
						}
					}

					const counter = this.staleCounter$.value - 2;
					if (counter % 3 === 0) {
						const maxCounter = this.settings.evaluateQueryDebounceTime;
						const progress = (counter / (maxCounter - 2)) * 100;
						this.staleProgress$.next(progress);
					}
				});
		});
	}

	private search(item: Item, currency?: Currency): void {
		this.searched$.next(true);
		const options: ItemSearchOptions = {
			...this.options,
		};
		currency = currency || this.currencies[0];
		this.searchSubscription = this.itemSearchService
			.searchOrExchange(item, options, currency)
			.pipe(takeUntil(this.queryItemChange))
			.subscribe({
				next: (search) => {
					this.search$.next(search);
					if (search.total > 0) {
						const count = Math.min(this.options.fetchCount, search.total);
						this.count$.next(count);
						switch (search.searchType) {
							case TradeSearchType.NormalTrade:
								this.listTradeSearch(search as TradeSearchResult, currency);
								break;

							case TradeSearchType.BulkExchange:
								this.listExchangeSearch(search as ExchangeSearchResult, currency);
								break;
						}
					}
				},
				error: (error) => this.handleError(error)
			});
	}

	private listTradeSearch(search: TradeSearchResult, currency?: Currency): void {
		this.listSubscription = this.itemSearchService
			.listTradeSearch(search, this.options.fetchCount)
			.pipe(takeUntil(this.queryItemChange))
			.subscribe({
				next: (listings) => {
					this.listings$.next(listings);
					if (listings.length > 0) {
						this.analyze(listings, currency);
					}
				},
				error: (error) => {
					if (!error.browserUrl) {
						this.handleError({
							response: error,
							browserUrl: search.url,
						});
					} else {
						this.handleError(error);
					}
				}
			});
	}

	private listExchangeSearch(search: ExchangeSearchResult, currency?: Currency): void {
		this.listSubscription = this.itemSearchService
			.listExchangeSearch(search, this.options.fetchCount)
			.pipe(takeUntil(this.queryItemChange))
			.subscribe({
				next: (listings) => {
					this.listings$.next(listings);
					if (listings.length > 0) {
						this.analyze(listings, currency);
					}
				},
				error: (error) => {
					if (!error.browserUrl) {
						this.handleError({
							response: error,
							browserUrl: search.url,
						});
					} else {
						this.handleError(error);
					}
				}
			});
	}

	private analyze(listings: ItemSearchListing[], currency?: Currency): void {
		const currencies = currency ? [currency] : this.currencies;
		this.analyzeSubscription = this.itemSearchAnalyzeService
			.analyze(listings, currencies)
			.pipe(takeUntil(this.queryItemChange))
			.subscribe({
				next: (result) => this.result$.next(result),
				error: (error) => this.handleError(error)
			});
	}

	private clear(): void {
		this.lastError = undefined;
		this.error$.next(undefined);
		this.search$.next(undefined);
		this.listings$.next(undefined);
		this.result$.next(undefined);
		this.listSubscription?.unsubscribe();
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private handleError(error: any): void {
		const handleHttpError = (error: HttpErrorResponse) => {
			switch (error.status) {
				case 429:
					this.error$.next('evaluate.errors.rate');
					break;
				default:
					this.error$.next('evaluate.errors.http');
					break;
			}
		};

		this.clear();
		if (!APP_CONFIG.production) {
			console.log(error);
		}
		this.lastError = error;
		this.logger.warn(error);
		if (typeof error === 'string') {
			this.error$.next(error);
		} else if (ofType<HttpErrorResponse>(error)) {
			handleHttpError(error);
		} else if (error && ofType<HttpErrorResponse>(error.response)) {
			handleHttpError(error.response);
		} else {
			this.error$.next('evaluate.error');
		}
	}
}
