import { Pipe, PipeTransform } from '@angular/core';
import { WordService } from '@shared/service';
import { Language } from '@shared/type';

@Pipe({
	name: 'word',
})
export class WordPipe implements PipeTransform {
	constructor(private readonly wordService: WordService) { }

	public transform(value: string, language: Language): string {
		return this.wordService.translate(value, language);
	}
}
