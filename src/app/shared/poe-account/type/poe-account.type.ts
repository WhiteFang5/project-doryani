export interface PoEAccount {
	loggedIn: boolean;
	name?: string;
	characters?: PoECharacter[];
}

export interface PoECharacter {
	name: string;
	leagueId?: string;
	level?: number;
	experience?: number;
	lastActive?: boolean;
}
