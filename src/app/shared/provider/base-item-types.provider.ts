import { Injectable } from '@angular/core';
import { default as untypedBaseItemTypes } from '@assets/poe2/base-item-types-v2.json';
import { EnumValues } from '@core/class/values.class';
import { BaseItemType, BaseItemTypeNameMap, Language } from '@shared/type';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseItemTypes: Record<string, any> = untypedBaseItemTypes;

@Injectable({
	providedIn: 'root',
})
export class BaseItemTypesProvider {
	private readonly baseItemTypeNames: BaseItemTypeNameMap[] = [];

	constructor() {
		const languages = new EnumValues(Language);
		for (const language of languages.keys) {
			this.baseItemTypeNames[language] = {};
		}
		for (const key in baseItemTypes) {
			const baseItemType = this.provideBaseItemType(key);
			if (baseItemType) {
				for (const language in baseItemType.names) {
					const name = baseItemType.names[language];
					if (!this.baseItemTypeNames[+language][name]) {
						this.baseItemTypeNames[+language][name] = key;
					}
				}
			}
		}
	}

	public provideBaseItemType(id: string): BaseItemType | undefined {
		return baseItemTypes[id];
	}

	public provideNames(language: Language): BaseItemTypeNameMap {
		return this.baseItemTypeNames[language];
	}
}
