import { Injectable } from '@angular/core';
import { cyrb53 } from '@core/function/hash';
import { CacheService } from '@core/service';
import { ItemPricePrediction } from '@shared/item/type';
import { ItemPricePredictionHttpService } from '@shared/poe-prices/service/item-price-prediction-http.service';
import { CacheExpirationType } from '@shared/type';
import { Observable, map, mergeMap } from 'rxjs';

const CACHE_PATH = 'item_price_';

@Injectable({
	providedIn: 'root',
})
export class ItemPricePredictionProvider {
	constructor(
		private readonly http: ItemPricePredictionHttpService,
		private readonly cache: CacheService
	) { }

	public provide(leagueId: string, stringifiedItem: string): Observable<ItemPricePrediction> {
		const hash = cyrb53(stringifiedItem);
		const key = `${CACHE_PATH}${leagueId}_${hash}`;
		return this.cache.prune(CACHE_PATH).pipe(
			mergeMap(() =>
				this.cache.proxy(
					key,
					() =>
						this.http.get(leagueId, stringifiedItem).pipe(
							map((response) => {
								const currencyId = response.currency === 'exalt' ? 'exalted' : response.currency;
								const result: ItemPricePrediction = {
									currencyId,
									currency: response.currency,
									max: response.max,
									min: response.min,
									score: response.pred_confidence_score,
								};
								return result;
							})
						),
					CacheExpirationType.FifteenMin,
					true
				)
			)
		);
	}
}
