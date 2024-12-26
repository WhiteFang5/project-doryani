import { Injectable } from '@angular/core';
import { default as tradeRegexes } from '@assets/poe2/trade-regexes.json';
import { TradeRegexes } from '@feature/trade-companion/type/trade-companion.type';

@Injectable({
	providedIn: 'root',
})
export class TradeRegexesProvider {
	public provide(): TradeRegexes {
		return tradeRegexes;
	}
}
