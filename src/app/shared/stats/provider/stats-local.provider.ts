import { Injectable } from '@angular/core';
import { default as untypedStatsLocal } from '@assets/poe2/stats-local.json';
import { StatType } from '@shared/stats/type';
import { StatLocalMap } from '@shared/type';

interface StatsLocal {
	enchant: StatLocalMap;
	explicit: StatLocalMap;
	implicit: StatLocalMap;
	sanctum: StatLocalMap;
}

const statsLocal = untypedStatsLocal as StatsLocal;

@Injectable({
	providedIn: 'root',
})
export class StatsLocalProvider {
	public provide(group: StatType): StatLocalMap {
		switch (group) {
			case StatType.Explicit:
				return statsLocal.explicit;
			case StatType.Implicit:
				return statsLocal.implicit;
			case StatType.Enchant:
				return statsLocal.enchant;
			case StatType.Sanctum:
				return statsLocal.sanctum;
			default:
				console.warn(`Missing StatsLocal for StatType '${group}'`);
				return {};
		}
	}
}
