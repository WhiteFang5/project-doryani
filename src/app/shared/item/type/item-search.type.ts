import { Currency } from "@shared/currency/type";
import { ExchangeFetchResult, TradeSearchType } from "@shared/poe-api";
import { Language } from "@shared/type";

export interface ItemSearchListing {
	seller: string;
	indexed: Date;
	age: string;
	currency: Currency;
	amount: number;
	priceNumerator: number;
	priceDenominator: number;
}

export interface SearchResult {
	searchType: TradeSearchType;
	id: string;
	language: Language;
	url: string;
	total: number;
}

export interface TradeSearchResult extends SearchResult {
	hits: string[];
}

export interface ExchangeSearchResult extends SearchResult {
	hits: Record<string, ExchangeFetchResult>;
}

export type ItemSearchResult = TradeSearchResult | ExchangeSearchResult;
