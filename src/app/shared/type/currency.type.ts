export interface Currency {
	id: string;
	nameType: string;
	image: string;
}

export interface CurrencyTrade {
	tradeId: string;
	nameType: string;
}

export type CurrencyChaosEquivalents = Record<string, number>;

export interface CurrencyRange {
	min: number;
	max: number;
}
