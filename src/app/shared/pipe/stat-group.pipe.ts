import { Pipe, PipeTransform } from '@angular/core';
import { ItemStat } from '@shared/item/type';

@Pipe({
	name: 'statGroup',
})
export class StatGroupPipe implements PipeTransform {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public transform(stats: ItemStat[] | undefined): any {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const groups: any = {};
		if (stats) {
			stats.forEach((stat, index) =>
				(groups[stat.type] || (groups[stat.type] = [])).push({
					...stat,
					index,
				})
			);
		}
		return groups;
	}
}
