import { Injectable } from '@angular/core';
import { default as untypedStats } from '@assets/poe2/stats.json';
import { StatType } from '@shared/stats/type';
import { StatMap } from '@shared/type';

interface Stats {
	explicit: StatMap;
	implicit: StatMap;
	enchant: StatMap;
	sanctum: StatMap;
}

const stats = (untypedStats as unknown) as Stats;

@Injectable({
	providedIn: 'root',
})
export class StatsProvider {
	public provide(group: StatType): StatMap {
		switch (group) {
			case StatType.Explicit:
				return stats.explicit;
			case StatType.Implicit:
				return stats.implicit;
			case StatType.Enchant:
				return stats.enchant;
			case StatType.Sanctum:
				return stats.sanctum;
			default:
				console.warn(`Missing StatsLocal for StatType '${group}'`);
				return {};
		}
	}
}
