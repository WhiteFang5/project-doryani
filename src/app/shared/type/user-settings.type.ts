import { Language, UiLanguage } from './language.type';

export enum DialogSpawnPosition {
	Cursor = 1,
	Center = 2,
}

export interface UserSettings {
	leagueId?: string
	language?: Language
	gameLanguage?: Language
	uiLanguage?: UiLanguage
	openUserSettingsKeybinding?: string
	exitAppKeybinding?: string
	zoom?: number
	dialogSpawnPosition?: DialogSpawnPosition
	dialogOpacity?: number
	displayVersion?: boolean
	autoDownload?: boolean
	focusable?: boolean;
	charactersCacheExpiration?: number;
	activeCharacterName?: string;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
	openUserSettingsKeybinding: 'F7',
	exitAppKeybinding: 'F8',
	language: Language.English,
	gameLanguage: Language.English,
	uiLanguage: UiLanguage.English,
	zoom: 100,
	dialogSpawnPosition: DialogSpawnPosition.Center,
	dialogOpacity: 0.8,
	displayVersion: true,
	autoDownload: true,
	focusable: true,
};
