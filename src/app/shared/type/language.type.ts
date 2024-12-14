export enum UiLanguage {
	English = 1,
	Portuguese = 2,
	Russian = 3,
	Thai = 4,
	German = 5,
	French = 6,
	Spanish = 7,
	Korean = 8,
	SimplifiedChinese = 9,
	TraditionalChinese = 10,
	Polish = 11,
}

export enum Language {
	English = 1,
	Portuguese = 2,
	Russian = 3,
	Thai = 4,
	German = 5,
	French = 6,
	Spanish = 7,
	Korean = 8,
	// SimplifiedChinese = 9,
	TraditionalChinese = 10,
	Japanese = 11,
}

export type LanguageMap<TType> = Record<number, TType>;
