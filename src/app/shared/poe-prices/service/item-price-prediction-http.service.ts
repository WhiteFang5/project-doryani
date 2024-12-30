import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BrowserService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import { ItemPricePredictionResponse } from '@shared/poe-prices/schema/item-price-prediction.schema';
import { Observable, delay, mergeMap, of, retry, throwError } from 'rxjs';

const RETRY_COUNT = 3;
const RETRY_DELAY = 100;

const SOURCE = 'poeoverlay';

@Injectable({
	providedIn: 'root',
})
export class ItemPricePredictionHttpService {
	constructor(private readonly http: HttpClient, private readonly browser: BrowserService) { }

	public get(leagueId: string, stringifiedItem: string): Observable<ItemPricePredictionResponse> {
		const base64Item = btoa(decodeURIComponent(encodeURIComponent(stringifiedItem)));
		const encodedLeagueId = encodeURIComponent(leagueId);
		const encodedItem = encodeURIComponent(base64Item);

		const url = `${APP_CONFIG.poePrices.baseUrl}/api?l=${encodedLeagueId}&i=${encodedItem}&s=${SOURCE}`;
		return this.http.get<ItemPricePredictionResponse>(url).pipe(
			retry({
				delay: (errors) =>
					errors.pipe(mergeMap((response: HttpErrorResponse, count) => this.handleError(url, response, count)))
			}),
			mergeMap((response) => {
				if (response.error_msg && response.error_msg.length > 0) {
					return throwError(() => response.error_msg);
				}
				return of(response);
			})
		);
	}

	public post(
		leagueId: string,
		stringifiedItem: string,
		selector: 'fair' | 'high' | 'low',
		min: number,
		max: number,
		currencyId: 'chaos' | 'exalt' | 'divine'
	): Observable<string> {
		const form = new FormData();
		form.set('league', leagueId);
		form.set('min', `${min}`);
		form.set('max', `${max}`);
		form.set('selector', selector);
		form.set('currency', currencyId);
		form.set('qitem_text', btoa(stringifiedItem));
		form.set('debug', `${APP_CONFIG.production ? 0 : 1}`);
		form.set('source', SOURCE);

		const url = `${APP_CONFIG.poePrices.baseUrl}/send_feedback`;
		return this.http
			.post<string>(url, form)
			.pipe(
				retry({
					delay: (errors) =>
						errors.pipe(mergeMap((response: HttpErrorResponse, count) => this.handleError(url, response, count)))
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
}
