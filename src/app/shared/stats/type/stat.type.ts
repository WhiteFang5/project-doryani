import { ItemStat } from "@shared/item/type";

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

export interface StatsSearchResult {
	stat: ItemStat;
	match: StatsSectionText;
}

export interface StatsSectionText {
	index: number;
	text: string;
}

export interface StatsSearchOptions {
	sanctum?: boolean;
	map?: boolean;
	// The options below must match the ones used in stats-local.json
	local_poison_on_hit__?: boolean;
	local_minimum_added_physical_damage_local_maximum_added_physical_damage?: boolean;
	local_minimum_added_fire_damage_local_maximum_added_fire_damage?: boolean;
	local_minimum_added_cold_damage_local_maximum_added_cold_damage?: boolean;
	local_minimum_added_lightning_damage_local_maximum_added_lightning_damage?: boolean;
	local_minimum_added_chaos_damage_local_maximum_added_chaos_damage?: boolean;
	local_attack_speed___?: boolean;
	local_base_physical_damage_reduction_rating?: boolean;
	local_physical_damage_reduction_rating___?: boolean;
	local_base_evasion_rating?: boolean;
	local_evasion_rating___?: boolean;
	local_energy_shield?: boolean;
	local_accuracy_rating?: boolean;
	local_mana_leech_from_physical_damage_permyriad?: boolean;
	local_life_leech_from_physical_damage_permyriad?: boolean;
	local_critical_strike_chance___?: boolean;
	critical_strike_chance___?: boolean;
}
