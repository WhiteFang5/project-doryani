import { UserSettings } from "@shared/type";

export interface BookmarkUserSettings extends UserSettings {
	bookmarks: BookmarkUserBookmark[];
}

export interface BookmarkUserBookmark {
	url: string;
	shortcut: string | undefined;
	external: boolean;
}
