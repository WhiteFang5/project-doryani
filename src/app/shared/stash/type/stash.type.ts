import { Currency } from "@shared/currency/type";

export enum StashNavigationDirection {
	Left,
	Right,
}

export enum StashPriceTagType {
	Exact = '~price',
	Negotiable = '~b/o',
}
export interface StashPriceTag {
	amount: number;
	currency: Currency;
	type?: StashPriceTagType;
	count?: number;
}
