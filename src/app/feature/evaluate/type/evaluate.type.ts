import { ItemSearchIndexed } from "@feature/evaluate/type";
import { Item } from "@shared/item/type";
import { StashPriceTag } from "@shared/stash/type/stash.type";
import { Language, UserSettings } from "@shared/type";

export const EVALUATE_QUERY_DEBOUNCE_TIME_MAX = 100;
export const EVALUATE_QUERY_FETCH_COUNT_MAX = 100;

export interface EvaluateUserSettings extends UserSettings {
	evaluateCurrencyOriginal: boolean;
	evaluateCurrencyIds: string[];
	evaluateKeybinding: string;
	evaluateResultView: EvaluateResultView;
	evaluateTranslatedItemLanguage: Language;
	evaluateTranslatedKeybinding: string;
	evaluateQueryDefaultItemLevel: boolean;
	evaluateQueryDefaultLinks: number;
	evaluateQueryDefaultColors: number;
	evaluateQueryDefaultMiscs: boolean;
	evaluateQueryDefaultType: boolean;
	evaluateQueryDefaultAttack: boolean;
	evaluateQueryDefaultDefense: boolean;
	evaluateQueryNormalizeQuality: boolean;
	evaluatePropertyMinRange: number;
	evaluatePropertyMaxRange: number;
	evaluateQueryDefaultStats: Record<string, boolean | undefined>;
	evaluateQueryDefaultStatsUnique: boolean;
	evaluateQueryDefaultStatsEnchants: boolean;
	evaluateQueryOnline: boolean;
	evaluateQueryIndexedRange: ItemSearchIndexed;
	evaluateModifierMinRange: number;
	evaluateModifierMaxRange: number;
	evaluateQueryDebounceTime: number;
	evaluateQueryFetchCount: number;
	evaluateQueryInitialSearch: boolean;
	evaluatePricing: EvaluatePricing;
	evaluateBrowserAlwaysExternal: boolean;
	evaluateCopyAdvancedItemText: boolean;
	evaluateShowPricePrediction: boolean;
	evaluateShowExchangeRate: boolean;
}

export enum EvaluateResultView {
	Graph = 1,
	List = 2,
}

export enum EvaluatePricing {
	Clipboard = 1,
}

export interface EvaluateResult extends StashPriceTag {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	tmp?: any;
}

export interface EvaluateDialogData {
	item: Item;
	settings: EvaluateUserSettings;
	language?: Language;
	gameLanguage?: Language;
}

export interface EvaluateOptions {
	online: boolean;
	indexed: ItemSearchIndexed;
	leagueId: string | undefined;
	fetchCount: number;
}

export interface EvaluateQueryItemResult {
	queryItem: Item;
	defaultItem: Item;
}
