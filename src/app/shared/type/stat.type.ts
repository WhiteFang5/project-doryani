export enum StatType {
	Explicit = 'explicit',
	Implicit = 'implicit',
	Enchant = 'enchant',
	Rune = 'rune',
	Sanctum = 'sanctum',
	Skill = 'skill',
}

export interface Stat {
	id?: string;
	mod?: string;
	negated?: boolean;
	text: Record<number, StatDesc[]>;
	option?: boolean;
}

export type StatDesc = Record<string, string>;
