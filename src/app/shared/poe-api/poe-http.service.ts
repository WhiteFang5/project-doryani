import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BrowserService, LoggerService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import {
    ApiCharacterResponse,
    ApiErrorResponse,
    ApiProfileResponse,
    ExchangeSearchRequest, ExchangeSearchResponse,
    SearchResponse, TradeFetchResult,
    TradeLeaguesResult, TradeResponse,
    TradeSearchRequest, TradeSearchResponse, TradeSearchType, TradeStaticResult,
    TradeStatsResult
} from '@shared/poe-api/poe.schema';
import { Language } from '@shared/type';
import { Observable, Subscriber, delay, map, of, retry, throwError } from 'rxjs';
import { TradeRateLimitService } from './trade-rate-limit.service';

const RETRY_COUNT = 3;
const RETRY_DELAY = 300;
const RETRY_LIMIT_COUNT = 1;

const LEAGUES_REGEX = new RegExp(/"leagues": ?(?<leagues>\[(\r|\n|.)*?\]),/i);

const LogTag = 'poeHttp';

@Injectable({
	providedIn: 'root',
})
export class PoEHttpService {
	constructor(
		private readonly http: HttpClient,
		private readonly browser: BrowserService,
		private readonly limit: TradeRateLimitService,
		private readonly logger: LoggerService,
	) {
	}

	// For some odd reason this doesn't include Private Leagues when the player is authenticated.
	public getLeagues(language: Language): Observable<TradeResponse<TradeLeaguesResult>> {
		const url = this.getTradeApiUrl('data/leagues', language);
		return this.getAndParse('leagues', url);
	}

	// To obtain a list of private leagues, simply load the normal trade search page and find them using a regex.
	public getTradePageLeagues(language: Language): Observable<TradeResponse<TradeLeaguesResult>> {
		const url = this.getPoEUrl('trade2/search', language);
		return this.getAndTransform('trade-page-leagues', url).pipe(
			map((result) => {
				if (LEAGUES_REGEX.test(result)) {
					const exec = LEAGUES_REGEX.exec(result);
					return `{"result":${exec?.groups?.['leagues'] || ''}}`;
				}
				this.logger.warn('[TradeHTTP] Cannot find Leagues list on the trade page.');
				return '';
			}),
			map((result) => {
				if (!result) {
					return {
						result: []
					};
				}
				return this.parseResponse(result);
			})
		);
	}

	public getStatic(language: Language): Observable<TradeResponse<TradeStaticResult>> {
		const url = this.getTradeApiUrl('data/static', language);
		return this.getAndParse('data-static', url);
	}

	public getStats(language: Language): Observable<TradeResponse<TradeStatsResult>> {
		const url = this.getTradeApiUrl('data/stats', language);
		return this.getAndParse('data-stats', url);
	}

	public getLoginUrl(language: Language): string {
		// PoE 3.21: Redirecting to 'trade/search' instead of 'login' due to GET/POST issues causing an infinite cloudflare loop.
		// PoE 3.21.X/3.22: Redirecting to the 'no script login' due to the normal login using 'object.hasOwn' which is not supported by Electron 8.X
		return this.getPoEUrl('login?no-script', language);
	}

	public getLogoutUrl(language: Language): string {
		return this.getPoEUrl('logout', language);
	}

	public getAccountInfo(language: Language): Observable<ApiProfileResponse | ApiErrorResponse> {
		const url = this.getApiUrl('profile', language);
		return this.getAndParse('account-profile', url);
	}

	public getCharacters(accountName: string, language: Language): Observable<ApiCharacterResponse[] | ApiErrorResponse> {
		const url = this.getPoEUrl(`character-window/get-characters?accountName=${encodeURIComponent(accountName)}`, language);
		return this.getAndParse('character-names', url);
	}

	public search(
		request: TradeSearchRequest,
		language: Language,
		leagueId: string
	): Observable<TradeSearchResponse> {
		return this.searchOrExchange(request, language, leagueId, TradeSearchType.NormalTrade);
	}

	public exchange(
		request: ExchangeSearchRequest,
		language: Language,
		leagueId: string
	): Observable<ExchangeSearchResponse> {
		return this.searchOrExchange(request, language, leagueId, TradeSearchType.BulkExchange);
	}

	public fetch(
		itemIds: string[],
		queryId: string,
		language: Language
	): Observable<TradeResponse<TradeFetchResult>> {
		const url = this.getTradeApiUrl(`fetch/${itemIds.join(',')}`, language);
		return this.limit
			.throttle('fetch', () =>
				this.http.get<TradeResponse<TradeFetchResult>>(url, {
					params: new HttpParams({
						fromObject: {
							query: queryId,
						},
					}),
					withCredentials: true,
					observe: 'response',
				})
			)
			.pipe(
				retry({
					delay: (response, count) => this.handleError(url, response, count)
				})
			);
	}

	private searchOrExchange<TSearchResponse extends SearchResponse>(
		request: TradeSearchRequest | ExchangeSearchRequest,
		language: Language,
		leagueId: string,
		searchType: TradeSearchType
	): Observable<TSearchResponse> {
		const url = this.getTradeApiUrl(`${searchType}/${encodeURIComponent(leagueId)}`, language);
		const browserUrl = `${url.replace('/api', '')}?q=${encodeURIComponent(JSON.stringify(request))}`;
		this.logger.debug(LogTag, `Contacting ${browserUrl}`);
		return this.limit
			.throttle(searchType, () =>
				this.http.post<TSearchResponse>(url, request, {
					withCredentials: true,
					observe: 'response',
				})
			)
			.pipe(
				retry({
					delay: (response, count) => this.handleError(url, response, count, browserUrl)
				}),
				map((response) => {
					response.url = `${url.replace('/api', '')}/${encodeURIComponent(response.id)}`;
					response.searchType = searchType;
					return response;
				})
			);
	}

	private get(resource: string, url: string): Observable<string> {
		this.logger.debug(LogTag, `Contacting ${url}`);
		return new Observable(observer => {
			this.limit.throttle(resource, () =>
				this.http.get(url, {
					observe: 'response',
					responseType: 'text',
					withCredentials: true,
				})
			).pipe(
				retry({
					delay: (response, count) => this.handleError(url, response, count, undefined, observer)
				})
			).subscribe({
				next: response => observer.next(response),
				error: error => observer.error(error),
				complete: () => observer.complete()
			});
		});
	}

	private getAndTransform(resource: string, url: string): Observable<string> {
		return this.get(resource, url).pipe(map((response) => this.transformResponse(response)));
	}

	private getAndParse<TResponse>(resource: string, url: string): Observable<TResponse> {
		return this.getAndTransform(resource, url).pipe(map((result) => this.parseResponse(result)));
	}

	private parseResponse<TResponse>(result: string): TResponse {
		return JSON.parse(result) as TResponse;
	}

	private transformResponse(response: string): string {
		return response.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
			String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
		);
	}

	private getTradeApiUrl(postfix: string, language: Language): string {
		return this.getApiUrl(`trade2/${postfix}`, language);
	}

	private getApiUrl(postfix: string, language: Language): string {
		return this.getPoEUrl(`api/${postfix}`, language);
	}

	private getPoEUrl(postfix: string, language: Language): string {
		let baseUrl = APP_CONFIG.poe.baseUrl;
		switch (language) {
			case Language.English:
				break;
			case Language.Portuguese:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'br');
				break;
			case Language.Russian:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'ru');
				break;
			case Language.Thai:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'th');
				break;
			case Language.German:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'de');
				break;
			case Language.French:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'fr');
				break;
			case Language.Spanish:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'es');
				break;
			case Language.Japanese:
				baseUrl = APP_CONFIG.poe.countryUrl.replace('{country}', 'jp');
				break;
			default:
				throw new Error(`Could not map baseUrl to language: '${language}'.`);
		}
		return `${baseUrl}${postfix}`;
	}

	private handleError(url: string, response: HttpErrorResponse, count: number, browserUrl?: string, observer?: Subscriber<string>): Observable<unknown> {
		const throwCustomError = (response: unknown, browserUrl?: string) => {
			if (browserUrl) {
				return throwError(() => {
					return {
						response,
						browserUrl
					};
				});
			} else {
				return throwError(() => response);
			}
		};

		if (count >= RETRY_COUNT) {
			return throwCustomError(response, browserUrl);
		}
		switch (response.status) {
			case 400: // Bad Request
				try {
					const message = response?.error?.error?.message || 'no message';
					const code = response?.error?.error?.code || '-';
					return throwCustomError(`${code}: ${message}`, browserUrl);
				} catch {
					return throwCustomError(response.error, browserUrl);
				}
			case 401: // Unauthorized
				observer?.next(response.error);
				observer?.complete();
				return of(); // End the retry-chain
			case 403: // Forbidden
				if (count >= RETRY_LIMIT_COUNT) {
					return throwCustomError(response, browserUrl);
				}
				return this.browser.retrieve(url).pipe(delay(RETRY_DELAY));
			case 429: // Too Many Requests
				return throwCustomError(response, browserUrl);
			default:
				return of(response).pipe(delay(RETRY_DELAY));
		}
	}
}
