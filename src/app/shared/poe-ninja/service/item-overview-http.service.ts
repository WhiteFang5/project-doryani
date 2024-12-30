import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BrowserService, LoggerService } from '@core/service';
import { APP_CONFIG } from '@env/environment';
import { ItemOverviewResponse } from '@shared/poe-ninja/schema';
import { ItemOverviewType } from '@shared/poe-ninja/type';
import { Observable, of, throwError, delay, mergeMap, retry } from 'rxjs';

const PATH_TYPE_MAP = {
	// General
	[ItemOverviewType.Omen]: 'omen',
	[ItemOverviewType.DivinationCard]: 'divinationcards',
	[ItemOverviewType.Artifact]: 'artifacts',
	// Equipment & Gems
	[ItemOverviewType.UniqueWeapon]: 'unique-weapons',
	[ItemOverviewType.UniqueArmour]: 'unique-armours',
	[ItemOverviewType.UniqueAccessory]: 'unique-accessories',
	[ItemOverviewType.UniqueFlask]: 'unique-flaks',
	[ItemOverviewType.UniqueJewel]: 'unique-jewels',
	[ItemOverviewType.SkillGem]: 'skill-gems',
	// Atlas
	[ItemOverviewType.Map]: 'maps',
	[ItemOverviewType.UniqueMap]: 'unique-maps',
};

const RETRY_COUNT = 3;
const RETRY_DELAY = 100;

@Injectable({
	providedIn: 'root',
})
export class ItemOverviewHttpService {
	private readonly baseUrl: string;

	constructor(
		private readonly httpClient: HttpClient,
		private readonly browser: BrowserService,
		private readonly logger: LoggerService
	) {
		this.baseUrl = `${APP_CONFIG.poeNinja.baseUrl}/api/data/itemoverview`;
	}

	public get(leagueId: string, type: ItemOverviewType): Observable<ItemOverviewResponse> {
		const url = this.getUrl(leagueId, type);
		return this.httpClient.get<ItemOverviewResponse>(url).pipe(
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

				const result: ItemOverviewResponse = {
					lines: response.lines,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					url: `${APP_CONFIG.poeNinja.baseUrl}/challenge/${(PATH_TYPE_MAP as any)[type]}`,
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

	private getUrl(leagueId: string, type: ItemOverviewType): string {
		return `${this.baseUrl}?league=${encodeURIComponent(leagueId)}&type=${encodeURIComponent(
			type
		)}&language=en`;
	}
}
