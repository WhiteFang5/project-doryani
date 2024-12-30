import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BrowserService, LoggerService } from '@core/service';
import { EvaluateExchangeRateChartComponent } from '@feature/evaluate/component/evaluate-exchange-rate-chart/evaluate-exchange-rate-chart.component';
import { EvaluateOptions, EvaluateResult, EvaluateUserSettings } from '@feature/evaluate/type';
import { CurrencyFrameComponent } from '@shared/currency/component/currency-frame/currency-frame.component';
import { Currency } from '@shared/currency/type';
import { ItemExchangeRateService } from '@shared/item/service/item-exchange-rate.service';
import { Item, ItemExchangeRateResult, ItemRarity } from '@shared/item/type';
import { SnackBarService } from '@shared/material/service';
import { SharedModule } from '@shared/shared.module';
import { BehaviorSubject, Subject } from 'rxjs';

interface Result {
	error?: boolean;
	rate?: ItemExchangeRateResult;
}

@Component({
	selector: 'app-evaluate-exchange-rate',
	templateUrl: './evaluate-exchange-rate.component.html',
	styleUrls: ['./evaluate-exchange-rate.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		CurrencyFrameComponent,
		EvaluateExchangeRateChartComponent,
	],
})
export class EvaluateExchangeRateComponent implements OnInit {
	private _currencies!: Currency[];

	public inverse$ = new BehaviorSubject<boolean>(false);
	public result$ = new BehaviorSubject<Result | null>(null);

	@Input()
	public options!: EvaluateOptions;

	@Input()
	public optionsChange!: Subject<EvaluateOptions>;

	@Input()
	public item!: Item;

	@Input()
	public settings!: EvaluateUserSettings;

	@Input()
	public set currencies(currencies: Currency[]) {
		this._currencies = currencies;
		this.evaluate(this.item);
	}

	public get currencies(): Currency[] {
		return this._currencies;
	}

	@Output()
	public evaluateResult = new EventEmitter<EvaluateResult>();

	constructor(
		private readonly exchangeRate: ItemExchangeRateService,
		private readonly browser: BrowserService,
		private readonly snackbar: SnackBarService,
		private readonly logger: LoggerService
	) { }

	public ngOnInit(): void {
		this.optionsChange.subscribe(() => this.evaluate(this.item));
	}

	public onEvaluateWheel(event: WheelEvent): void {
		if (!this.result$.value || !this.result$.value.rate) {
			return;
		}

		const factor = event.deltaY > 0 ? -1 : 1;
		let index = this.currencies.findIndex((x) => x.id === this.result$.value?.rate?.currency.id);
		index += factor;
		if (index >= this.currencies.length) {
			index = 0;
		} else if (index < 0) {
			index = this.currencies.length - 1;
		}

		this.result$.next(null);
		this.evaluate(this.item, this.currencies[index]);
	}

	public onClick(event: MouseEvent): void {
		event.stopImmediatePropagation();

		const result = this.result$.getValue();
		if (result?.rate?.url) {
			this.browser.open(result.rate.url, event.ctrlKey);
		}
	}

	public onAmountClick(event: MouseEvent, amount: number, count?: number): void {
		event.stopImmediatePropagation();

		const currency = this.result$.value?.rate?.currency;
		if (!currency) {
			return;
		}
		this.evaluateResult.next({
			amount,
			count,
			currency,
		});
	}

	public roundAmount(amount: number): number {
		return Math.ceil(amount * 100) / 100;
	}

	private evaluate(item: Item, currency?: Currency): void {
		this.exchangeRate
			.get(item, currency ? [currency] : this.currencies, this.options.leagueId)
			.subscribe({
				next: (result) => {
					if (result) {
						this.inverse$.next(
							result.amount < 1 && result.factor <= 1 && item.rarity === ItemRarity.Currency
						);
					}
					this.result$.next({ rate: result });
				},
				error: (error) => this.handleError(error)
			});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private handleError(error: any): void {
		this.result$.next({ error: true });
		this.logger.warn(error);
		this.snackbar.error(`${typeof error === 'string' ? `${error}` : 'evaluate.error'}`);
	}
}
