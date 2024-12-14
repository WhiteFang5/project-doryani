import { Language } from './language.type';

export interface Context {
	language: Language;
	gameLanguage?: Language;
	leagueId?: string;
}
