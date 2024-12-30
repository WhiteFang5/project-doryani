import { Injectable } from '@angular/core';
import { default as untypedWords} from '@assets/poe2/words.json';
import { Language, WordMap } from '@shared/type';

interface Words {
	English: WordMap;
	French: WordMap;
	German: WordMap;
	Korean: WordMap;
	Portuguese: WordMap;
	Russian: WordMap;
	SimplifiedChinese: WordMap,
	Spanish: WordMap,
	Thai: WordMap,
	TraditionalChinese: WordMap,
	Japanese: WordMap,
}

const words = untypedWords as Words;

@Injectable({
	providedIn: 'root',
})
export class WordProvider {
	public provide(language: Language): WordMap {
		switch (language) {
			case Language.English:
				return words.English;
			case Language.Portuguese:
				return words.Portuguese;
			case Language.Russian:
				return words.Russian;
			case Language.Thai:
				return words.Thai;
			case Language.German:
				return words.German;
			case Language.French:
				return words.French;
			case Language.Spanish:
				return words.Spanish;
			case Language.Korean:
				return words.Korean;
			case Language.TraditionalChinese:
				return words.TraditionalChinese;
			case Language.Japanese:
				return words.Japanese;
			default:
				throw new Error(`Could not map words to language: '${Language[language]}'.`);
		}
	}
}
