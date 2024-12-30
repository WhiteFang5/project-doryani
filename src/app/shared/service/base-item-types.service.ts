import { Injectable } from '@angular/core';
import { BaseItemTypesProvider } from '@shared/provider';
import { ContextService } from '@shared/service';
import { BaseItemType, Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class BaseItemTypesService {
	private readonly cache: Record<string, Record<string, RegExp>> = {};

	constructor(
		private readonly context: ContextService,
		private readonly baseItemTypeProvider: BaseItemTypesProvider
	) { }

	public translate(id: string | undefined, language?: Language): string {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const name = this.get(id)?.names?.[language];
		if (!name) {
			return `untranslated: '${id}' for language: '${Language[language]}'`;
		}

		// reverse escape string regex
		return name.replace(/\\[.*+?^${}()|[\]\\]/g, (value) => value.replace('\\', ''));
	}

	public get(id: string | undefined): BaseItemType | undefined {
		if (!id) {
			return undefined;
		}
		return this.baseItemTypeProvider.provideBaseItemType(id);
	}

	public search(name: string, language?: Language): { id: string | undefined; baseItemType: BaseItemType | undefined; } {
		const id = this.searchId(name, language);
		return { id, baseItemType: this.get(id) };
	}

	public searchId(name: string, language?: Language): string | undefined {
		language = language || this.context.get().gameLanguage || this.context.get().language;

		const names = this.baseItemTypeProvider.provideNames(language);

		const nameKey = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const id = names[nameKey];
		if (id) {
			return id;
		}

		if (!this.cache[language]) {
			this.cache[language] = {};
		}

		const cache = this.cache[language];

		let maxScore = Number.MIN_VALUE;
		let maxId;
		for (const otherName in names) {
			const id = names[otherName];
			const expr =
				cache[id] ||
				(cache[id] = new RegExp('(?<=[\\s,.:;"\']|^)' + otherName + '(?=[\\s,.:;"\']|$)', ''));
			const match = expr.exec(name);
			if (match) {
				let score = otherName.split(' ').length * 10;

				const len = otherName.length;
				const pos = name.length / 2 - Math.abs(name.length / 2 - (match.index + len / 2));

				score += pos;
				score += len;

				if (score > maxScore) {
					maxScore = score;
					maxId = id;
				}
			}
		}
		return maxId;
	}
}
