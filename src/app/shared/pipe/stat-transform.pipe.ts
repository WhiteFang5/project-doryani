import { Pipe, PipeTransform } from '@angular/core';
import { ItemStat } from '@shared/item/type';
import { StatsService } from '@shared/stats/service';
import { Language } from '@shared/type';

@Pipe({
	name: 'statTransform',
})
export class StatTransformPipe implements PipeTransform {
	constructor(private readonly statsService: StatsService) { }

	public transform(stat: ItemStat, language: Language): string[] {
		return this.statsService.transform(stat, language);
	}
}
