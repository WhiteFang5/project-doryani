import { Currency } from "@shared/currency/type";

export interface ItemExchangeRateResult {
	currency: Currency;
	amount: number;
	inverseAmount: number;
	factor: number;
	change: number;
	history: number[];
	url: string;
}
