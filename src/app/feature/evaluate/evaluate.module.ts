import { NgModule } from '@angular/core';
import { FEATURES_TOKEN } from '@core/token';
import { EvaluateSettingsComponent } from '@feature/evaluate/component/evaluate-settings/evaluate-settings.component';
import { EvaluateService } from '@feature/evaluate/service/evaluate.service';
import { EvaluatePricing, EvaluateResultView, EvaluateUserSettings, ItemSearchIndexed } from '@feature/evaluate/type';
import { SharedModule } from '@shared/shared.module';
import { Feature, FeatureModule, Language, UserSettingsFeature } from '@shared/type';

@NgModule({
	providers: [{ provide: FEATURES_TOKEN, useClass: EvaluateModule, multi: true }],
	declarations: [],
	imports: [SharedModule],
})
export class EvaluateModule implements FeatureModule {
	constructor(private readonly evaluateService: EvaluateService) { }

	public getSettings(): UserSettingsFeature {
		const defaultSettings: EvaluateUserSettings = {
			evaluateCurrencyOriginal: true,
			evaluateCurrencyIds: ['chaos', 'divine'],
			evaluateResultView: EvaluateResultView.List,
			evaluateQueryDefaultItemLevel: true,
			evaluateQueryDefaultLinks: 5,
			evaluateQueryDefaultColors: 5,
			evaluateQueryDefaultMiscs: true,
			evaluateQueryDefaultType: false,
			evaluateQueryDefaultAttack: true,
			evaluateQueryDefaultDefense: true,
			evaluateQueryNormalizeQuality: true,
			evaluatePropertyMinRange: 10,
			evaluatePropertyMaxRange: 50,
			evaluateQueryDefaultStats: {
			},
			evaluateQueryDefaultStatsUnique: true,
			evaluateQueryDefaultStatsEnchants: true,
			evaluateQueryIndexedRange: ItemSearchIndexed.UpTo3DaysAgo,
			evaluateQueryOnline: true,
			evaluateQueryDebounceTime: 10,
			evaluateQueryFetchCount: 30,
			evaluateModifierMinRange: 10,
			evaluateModifierMaxRange: 50,
			evaluateKeybinding: 'CmdOrCtrl + D',
			evaluateTranslatedItemLanguage: Language.English,
			evaluateTranslatedKeybinding: 'Alt + T',
			evaluatePricing: EvaluatePricing.Clipboard,
			evaluateQueryInitialSearch: false,
			evaluateBrowserAlwaysExternal: false,
			evaluateCopyAdvancedItemText: true,
			evaluateShowPricePrediction: true,
			evaluateShowExchangeRate: true,
		};
		return {
			name: 'evaluate.name',
			component: EvaluateSettingsComponent,
			defaultSettings,
			visualPriority: 100,
		};
	}

	public getFeatures(settings: EvaluateUserSettings): Feature[] {
		return [
			{
				name: 'evaluate',
				accelerator: settings.evaluateKeybinding,
			},
			{
				name: 'evaluate-translate',
				accelerator: settings.evaluateTranslatedKeybinding,
			},
		];
	}

	public run(feature: string, settings: EvaluateUserSettings): void {
		switch (feature) {
			case 'evaluate':
				this.evaluateService.evaluate(settings).subscribe();
				break;
			case 'evaluate-translate':
				this.evaluateService.evaluate(settings, settings.evaluateTranslatedItemLanguage).subscribe();
				break;
			default:
				break;
		}
	}
}
