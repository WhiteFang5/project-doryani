import { Injectable } from '@angular/core';
import { default as untypedClientStrings } from '@assets/poe2/client-strings.json';
import { ClientStringMap, Language } from '@shared/type';

interface ClientStrings {
	English: ClientStringMap;
	French: ClientStringMap;
	German: ClientStringMap;
	Korean: ClientStringMap;
	Portuguese: ClientStringMap;
	Russian: ClientStringMap;
	SimplifiedChinese: ClientStringMap,
	Spanish: ClientStringMap,
	Thai: ClientStringMap,
	TraditionalChinese: ClientStringMap,
	Japanese: ClientStringMap,
}

const clientStrings = untypedClientStrings as ClientStrings;

@Injectable({
	providedIn: 'root',
})
export class ClientStringProvider {
	public provide(language: Language): ClientStringMap {
		switch (language) {
			case Language.English:
				return clientStrings.English;
			case Language.Portuguese:
				return clientStrings.Portuguese;
			case Language.Russian:
				return clientStrings.Russian;
			case Language.Thai:
				return clientStrings.Thai;
			case Language.German:
				return clientStrings.German;
			case Language.French:
				return clientStrings.French;
			case Language.Spanish:
				return clientStrings.Spanish;
			case Language.Korean:
				return clientStrings.Korean;
			case Language.TraditionalChinese:
				return clientStrings.TraditionalChinese;
			case Language.Japanese:
				return clientStrings.Japanese;
			default:
				throw new Error(`Could not map clientstrings to language: '${Language[language]}'.`);
		}
	}
}
