import { Injectable } from '@angular/core';
import { BaseItemTypesService, ContextService, WordService } from '@shared/service';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemService {
	constructor(
		private readonly context: ContextService,
		private readonly baseItemTypesService: BaseItemTypesService,
		private readonly wordService: WordService
	) { }

	public getNameType(nameId: string | undefined, typeId: string, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		return `${this.getName(nameId, language)} ${this.getType(typeId, language)}`.trim();
	}

	public getName(nameId: string | undefined, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const name = nameId ? this.wordService.translate(nameId, language) : '';
		return name;
	}

	public getType(typeId: string | undefined, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const type = typeId ? this.baseItemTypesService.translate(typeId, language) : '';
		return type;
	}
}
