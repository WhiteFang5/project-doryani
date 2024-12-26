import { UserSettings } from "@shared/type";

export interface CommandUserSettings extends UserSettings {
	commands: CommandUserCommand[];
}

export interface CommandUserCommand {
	text: string;
	shortcut: string | undefined;
}
