import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EnumValues } from '@core/class/values.class';
import { ClipboardService } from '@core/service/input';
import { EVALUATE_QUERY_DEBOUNCE_TIME_MAX, EVALUATE_QUERY_FETCH_COUNT_MAX, EvaluatePricing, EvaluateResultView, EvaluateUserSettings } from '@feature/evaluate/type';
import { CurrencyService } from '@shared/currency/service/currency.service';
import { Currency } from '@shared/currency/type';
import { SelectListItem } from '@shared/material/component/select-list/select-list.component';
import { SnackBarService } from '@shared/material/service';
import { SharedModule } from '@shared/shared.module';
import { StatsProvider } from '@shared/stats/provider';
import { StatsService } from '@shared/stats/service';
import { StatType } from '@shared/stats/type';
import { Language, UserSettingsComponent } from '@shared/type';
import { BehaviorSubject } from 'rxjs';

interface StatSelectListItem extends SelectListItem {
	type: string;
}

@Component({
	selector: 'app-evaluate-settings',
	templateUrl: './evaluate-settings.component.html',
	styleUrls: ['./evaluate-settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class EvaluateSettingsComponent implements UserSettingsComponent {
	public languages = new EnumValues(Language);
	public views = new EnumValues(EvaluateResultView);
	public pricings = new EnumValues(EvaluatePricing);

	@Input()
	public settings!: EvaluateUserSettings;

	@Input()
	public defaultSettings!: EvaluateUserSettings;

	public currencies$ = new BehaviorSubject<Currency[]>([]);
	public stats$ = new BehaviorSubject<StatSelectListItem[]>([]);

	public debounceTimeMax = EVALUATE_QUERY_DEBOUNCE_TIME_MAX;
	public fetchCountMax = EVALUATE_QUERY_FETCH_COUNT_MAX;

	public displayWithTime = (value: number) =>
		value === this.debounceTimeMax ? '∞' : `${Math.round(value * 10) / 100}s`;
	public displayWithCount = (value: number) => `${value} items`;
	public displayWithStat = (value: number) => (value === 50 ? '#' : value.toString());

	constructor(
		private readonly currencyService: CurrencyService,
		private readonly statsProvider: StatsProvider,
		private readonly statsService: StatsService,
		private readonly clipboard: ClipboardService,
		private readonly snackbar: SnackBarService
	) { }

	public load(): void {
		if (this.settings.language) {
			this.updateCurrencies();
		}
		if (this.settings.gameLanguage) {
			this.updateStats();
		}
	}

	public onStatsChange(stats: SelectListItem[]): void {
		this.settings.evaluateQueryDefaultStats = {};
		stats.forEach((stat) => {
			if (stat.selected) {
				this.settings.evaluateQueryDefaultStats[stat.key] = true;
			}
		});
	}

	public onCurrenciesValueChange(): void {
		if (this.settings.evaluateCurrencyIds.length <= 0) {
			this.settings.evaluateCurrencyIds = ['exalted', 'divine'];
		}
	}

	public onExportStats(): void {
		try {
			const stats = JSON.stringify(this.settings.evaluateQueryDefaultStats, null, '\t');
			this.clipboard.writeText(stats);
			this.snackbar.success('stats were copied to clipboard successfully.');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (ex) {
			this.snackbar.error('stats could not be copied to clipboard.');
		}
	}

	public onImportStats(): void {
		const text = this.clipboard.readText();
		if (!text || text.length < 0) {
			this.snackbar.warning('clipboard was empty.');
			return;
		}

		let stats: Record<string, boolean | undefined>;
		try {
			stats = JSON.parse(text);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (ex) {
			this.snackbar.error('clipboard content could not be parsed.');
			return;
		}

		Object.getOwnPropertyNames(stats).forEach((key) => {
			if (!this.stats$.value.find((x) => x.key === key)) {
				delete stats[key];
			}
		});
		this.settings.evaluateQueryDefaultStats = stats;
		this.updateStats();
		this.snackbar.success('stats were imported successfully.');
	}

	public itemPredicate(item: SelectListItem, filterValue: string): boolean {
		const statItem = item as StatSelectListItem;
		const itemValue = `${statItem.type.toLowerCase()} ${statItem.text.toLowerCase()}`;
		return itemValue.indexOf(filterValue) !== -1;
	}

	private updateStats(): void {
		const items: StatSelectListItem[] = [];

		const types = [
			StatType.Explicit,
			StatType.Implicit,
			StatType.Enchant,
			StatType.Sanctum,
		];
		types.forEach((type) => {
			const stats = this.statsProvider.provide(type);
			Object.getOwnPropertyNames(stats).forEach((tradeId) => {
				const stat = stats[tradeId];
				const localStat = stat.text[this.settings.gameLanguage!];
				if (localStat) {
					localStat.forEach((_, index) => {
						const key = `${type}.${tradeId}`;
						const item: StatSelectListItem = {
							key,
							type,
							text: this.statsService.translate(stat, index, this.settings.gameLanguage),
							selected: !!this.settings.evaluateQueryDefaultStats[key],
						};
						items.push(item);
					});
				} else {
					console.warn(`Stat with ${tradeId} not found in ${this.settings.gameLanguage}.`);
				}
			});
		});
		this.stats$.next(items);
	}

	private updateCurrencies(): void {
		this.currencyService.get(this.settings.language).subscribe((currencies) => {
			if (this.settings.evaluateCurrencyIds) {
				this.settings.evaluateCurrencyIds = this.settings.evaluateCurrencyIds.filter((id) =>
					currencies.find((currency) => currency.id === id)
				);
				if (this.settings.evaluateCurrencyIds.length <= 0) {
					this.settings.evaluateCurrencyIds = [currencies[0]?.id];
				}
			}
			this.currencies$.next(currencies);
		});
	}
}
