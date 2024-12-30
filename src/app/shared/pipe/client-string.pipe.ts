import { Pipe, PipeTransform } from '@angular/core';
import { ClientStringService } from '@shared/service';
import { Language } from '@shared/type';

@Pipe({
	name: 'clientString',
})
export class ClientStringPipe implements PipeTransform {
	constructor(private readonly clientString: ClientStringService) { }

	public transform(value: string, language: Language): string {
		return this.clientString.translate(value, language);
	}
}
