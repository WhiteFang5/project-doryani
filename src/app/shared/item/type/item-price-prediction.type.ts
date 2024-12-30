import { Currency } from "@shared/currency/type";

export interface ItemPricePredictionResult {
	id: ItemPricePredictionResultId;
	currency: Currency;
	min: number;
	max: number;
	score: number;
}

export interface ItemPricePredictionResultId {
	leagueId: string;
	source: string;
	currency: 'chaos' | 'exalt' | 'divine';
	min: number;
	max: number;
}

export enum ItemPricePredictionFeedback {
	Low = 'low',
	Fair = 'fair',
	High = 'high',
}

export interface ItemPricePrediction {
	min: number;
	max: number;
	currency: 'chaos' | 'exalt' | 'divine';
	currencyId: string;
	score: number;
}
