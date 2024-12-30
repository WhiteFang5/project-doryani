export interface Currency {
	id: string;
	nameType: string;
	image?: string;
}

export interface CurrencyTrade {
	tradeId: string;
	nameType: string;
}

export type CurrencyPrimaryEquivalents = Record<string, number>;

export interface CurrencyRange {
	min: number;
	max: number;
}

export enum CurrencySelectStrategy {
	MinWithAtleast1,
}
