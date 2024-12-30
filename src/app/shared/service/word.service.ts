import { Injectable } from '@angular/core';
import { WordProvider } from '@shared/provider';
import { ContextService } from '@shared/service';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class WordService {
	constructor(
		private readonly context: ContextService,
		private readonly wordProvider: WordProvider
	) { }

	public translate(id: string | undefined, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const map = this.wordProvider.provide(language);
		if (id && map[id]) {
			return map[id];
		}

		return `untranslated: '${id}' for language: '${Language[language]}'`;
	}

	public search(text: string, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const map = this.wordProvider.provide(language);
		return map[text];
	}
}
