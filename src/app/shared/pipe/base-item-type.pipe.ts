import { Pipe, PipeTransform } from '@angular/core';
import { BaseItemTypesService } from '@shared/service';
import { Language } from '@shared/type';

@Pipe({
	name: 'baseItemType',
})
export class BaseItemTypePipe implements PipeTransform {
	constructor(private readonly baseItemTypesService: BaseItemTypesService) { }

	public transform(value: string, language: Language): string {
		return this.baseItemTypesService.translate(value, language);
	}
}
