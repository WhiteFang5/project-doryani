import { Injectable } from '@angular/core';
import { default as indistinguishableStats } from '@assets/poe2/stats-indistinguishable.json';
import { StatType } from '@shared/stats/type';
import { StatIndistinguishableMap } from '@shared/type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedIndistinguishableStats: Record<string, any> = indistinguishableStats;

@Injectable({
	providedIn: 'root',
})
export class StatsIndistinguishableProvider {
	public provide(group: StatType): StatIndistinguishableMap {
		return typedIndistinguishableStats[group];
	}
}
