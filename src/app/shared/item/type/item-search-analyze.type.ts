import { Currency } from "@shared/currency/type";
import { ItemSearchListing } from "@shared/item/type";

export type SearchAnalyzeEntry = ItemSearchListing & {
	original: Currency;
	originalAmount: number;
	target: Currency;
	targetAmount: number;
	targetAmountRounded: number;
};

export interface SearchAnalyzeEntryGrouped {
	value: number;
	hidden: number;
	mean?: string;
	items: SearchAnalyzeEntry[];
}

export interface SearchAnalyzeValues {
	min: number;
	max: number;
	mode: number;
	median: number;
	mean: number;
}

export interface ItemSearchAnalyzeResult {
	entries: SearchAnalyzeEntry[];
	entryGroups?: SearchAnalyzeEntryGrouped[];
	currency?: Currency;
	values?: SearchAnalyzeValues;
}
