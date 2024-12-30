import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BrowserService, LoggerService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import { CurrencyOverviewResponse } from '@shared/poe-ninja/schema';
import { CurrencyOverviewType } from '@shared/poe-ninja/type';
import { Observable, delay, mergeMap, of, retry, throwError } from 'rxjs';

const PATH_TYPE_MAP = {
	[CurrencyOverviewType.Currency]: 'currency',
	[CurrencyOverviewType.Fragment]: 'fragments',
};

const RETRY_COUNT = 3;
const RETRY_DELAY = 100;

@Injectable({
	providedIn: 'root',
})
export class CurrencyOverviewHttpService {
	private readonly baseUrl: string;

	constructor(
		private readonly httpClient: HttpClient,
		private readonly browser: BrowserService,
		private readonly logger: LoggerService
	) {
		this.baseUrl = `${APP_CONFIG.poeNinja.baseUrl}/api/data/currencyoverview`;
	}

	public get(leagueId: string, type: CurrencyOverviewType): Observable<CurrencyOverviewResponse> {
		const url = this.getUrl(leagueId, type);
		return this.httpClient.get<CurrencyOverviewResponse>(url).pipe(
			retry({
				delay: (errors) => errors.pipe(mergeMap((response: HttpErrorResponse, count) => this.handleError(url, response, count)))
			}),
			mergeMap((response) => {
				if (!response?.lines) {
					if (leagueId !== 'Standard') {
						this.logger.info(
							`Got empty result from '${url}'. Using Standard league for now.`,
							response
						);
						return this.get('Standard', type);
					}
					this.logger.warn(`Got empty result from '${url}'.`, response);
					return throwError(() => `Got empty result from '${url}'.`);
				}

				const result: CurrencyOverviewResponse = {
					lines: response.lines,
					url: `${APP_CONFIG.poeNinja.baseUrl}/challenge/${PATH_TYPE_MAP[type]}`,
				};
				return of(result);
			})
		);
	}

	private handleError(url: string, response: HttpErrorResponse, count: number): Observable<void> {
		if (count >= RETRY_COUNT) {
			return throwError(() => response);
		}

		switch (response.status) {
			case 403:
				return this.browser.retrieve(url).pipe(delay(RETRY_DELAY));
			default:
				return of().pipe(delay(RETRY_DELAY));
		}
	}

	private getUrl(leagueId: string, type: CurrencyOverviewType): string {
		return `${this.baseUrl}?league=${encodeURIComponent(leagueId)}&type=${encodeURIComponent(
			type
		)}&language=en`;
	}
}
