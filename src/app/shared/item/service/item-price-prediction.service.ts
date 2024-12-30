import { Injectable } from '@angular/core';
import { CurrencyConverterService } from '@shared/currency/service/currency-converter.service';
import { CurrencySelectService } from '@shared/currency/service/currency-select.service';
import { Currency, CurrencySelectStrategy } from '@shared/currency/type';
import { ItemPricePredictionProvider } from '@shared/item/provider/item-price-prediction.provider';
import { Item, ItemPricePredictionFeedback, ItemPricePredictionResult, ItemPricePredictionResultId } from '@shared/item/type';
import { ItemPricePredictionHttpService } from '@shared/poe-prices/service/item-price-prediction-http.service';
import { ContextService } from '@shared/service';
import { Observable, forkJoin, map, mergeMap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ItemPricePredictionService {
	constructor(
		private readonly context: ContextService,
		private readonly http: ItemPricePredictionHttpService,
		private readonly prediction: ItemPricePredictionProvider,
		private readonly currencyConverter: CurrencyConverterService,
		private readonly currencySelect: CurrencySelectService
	) { }

	public predict(
		item: Item,
		currencies: Currency[],
		leagueId?: string
	): Observable<ItemPricePredictionResult> {
		leagueId = leagueId || this.context.get().leagueId;

		// TODO: translate item source
		const { source } = item;
		return this.prediction.provide(leagueId!, source!).pipe(
			mergeMap((prediction) =>
				forkJoin(
					currencies.map((currency) =>
						this.currencyConverter.convert(prediction.currencyId, currency.id)
					)
				).pipe(
					map((factors) => {
						const { min, max } = prediction;
						const values = factors.filter((f): f is number => !f).map((factor) => [min * factor, max * factor]);
						const index = this.currencySelect.select(values, CurrencySelectStrategy.MinWithAtleast1);
						const { score, currency } = prediction;
						const result: ItemPricePredictionResult = {
							id: {
								source: source!,
								leagueId: leagueId!,
								currency,
								min,
								max,
							},
							score,
							currency: currencies[index],
							min: Math.round(values[index][0] * 100) / 100,
							max: Math.round(values[index][1] * 100) / 100,
						};
						return result;
					})
				)
			)
		);
	}

	public feedback(
		id: ItemPricePredictionResultId,
		feedback: ItemPricePredictionFeedback
	): Observable<boolean> {
		return this.http
			.post(id.leagueId, id.source, feedback, id.min, id.max, id.currency)
			.pipe(map((response) => response === feedback));
	}
}
