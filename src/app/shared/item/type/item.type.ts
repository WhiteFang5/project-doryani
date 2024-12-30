import { Query } from "@shared/poe-api";
import { StatType } from "@shared/stats/type";
import { Language } from "@shared/type";

export interface Item {
	source?: string;
	rarity?: ItemRarity;
	category?: ItemCategory;
	nameId?: string;
	name?: string;
	typeId?: string;
	type?: string;
	level?: ItemValue;
	corrupted?: boolean;
	mirrored?: boolean;
	unmodifiable?: boolean;
	unidentified?: boolean;
	relic?: boolean;
	damage?: ItemWeaponDamage
	sockets?: ItemSocket[];
	properties?: ItemProperties;
	requirements?: ItemRequirements;
	stats?: ItemStat[];
	note?: string;
}

export interface ItemValue {
	text: string;
	value?: number;
	min?: number;
	max?: number;
	tier?: ItemValueTier;
}

export interface ItemValueTier {
	min?: number;
	max?: number;
}

export enum ItemRarity {
	Normal = 'normal',
	Magic = 'magic',
	Rare = 'rare',
	Unique = 'unique',
	UniqueRelic = 'uniquefoil',
	Currency = 'currency',
	Gem = 'gem',
	DivinationCard = 'divinationcard',
	NonUnique = 'nonunique',
	Quest = 'quest',
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export enum ItemCategory {
	Weapon = 'weapon',
	WeaponOneMelee = 'weapon.onemelee',
	WeaponUnarmed = 'weapon.unarmed',
	WeaponClaw = 'weapon.claw',
	WeaponDagger = 'weapon.dagger',
	WeaponOneSword = 'weapon.onesword',
	WeaponOneAxe = 'weapon.oneaxe',
	WeaponOneMace = 'weapon.onemace',
	WeaponSpear = 'weapon.spear',
	WeaponFlail = 'weapon.flail',
	WeaponTwoMelee = 'weapon.twomelee',
	WeaponTwoSword = 'weapon.twosword',
	WeaponTwoAxe = 'weapon.twoaxe',
	WeaponTwoMace = 'weapon.twomace',
	WeaponWarstaff = 'weapon.warstaff',
	WeaponRanged = 'weapon.ranged',
	WeaponBow = 'weapon.bow',
	WeaponCrossbow = 'weapon.crossbow',
	WeaponCaster = 'weapon.caster',
	WeaponWand = 'weapon.wand',
	WeaponSceptre = 'weapon.sceptre',
	WeaponStaff = 'weapon.staff',
	WeaponRod = 'weapon.rod',
	Armour = 'armour',
	ArmourHelmet = 'armour.helmet',
	ArmourChest = 'armour.chest',
	ArmourGloves = 'armour.gloves',
	ArmourBoots = 'armour.boots',
	ArmourQuiver = 'armour.quiver',
	ArmourShield = 'armour.shield',
	ArmourFocus = 'armour.focus',
	ArmourBuckler = 'armour.buckler',
	Accessory = 'accessory',
	AccessoryAmulet = 'accessory.amulet',
	AccessoryBelt = 'accessory.belt',
	AccessoryRing = 'accessory.ring',
	Gem = 'gem',
	GemActiveGem = 'gem.activegem',
	GemSupportGem = 'gem.supportgem',
	GemMetaGem = 'gem.metagem',
	Jewel = 'jewel',
	Flask = 'flask',
	FlaskLife = 'flask.life',
	FlaskMana = 'flask.mana',
	Map = 'map',
	MapWaystone = 'map.waystone',
	MapFragment = 'map.fragment',
	MapLogbook = 'map.logbook',
	MapBreachstone = 'map.breachstone',
	MapBarya = 'map.barya',
	MapBossKey = 'map.bosskey',
	MapUltimatum = 'map.ultimatum',
	MapTablet = 'map.tablet',
	Card = 'card',
	SanctumRelic = 'sanctum.relic',
	Currency = 'currency',
	CurrencyOmen = 'currency.omen',
	CurrencySocketable = 'currency.socketable',
	CurrencyRune = 'currency.rune',
	CurrencySoulCore = 'currency.soulcore',
}

export interface ItemWeaponDamage {
	dps?: ItemValue;
	edps?: ItemValue;
	pdps?: ItemValue;
}

export interface ItemSocket {
	color: ItemSocketColor | undefined;
	linked: boolean | undefined;
}

export enum ItemSocketColor {
	Any = '#',
	Str = 'S',
	Dex = 'D',
	Int = 'I',
	Gen = 'G',
	Abyss = 'A',
	Delve = 'DV',
}

export interface ItemProperty {
	value: string;
	augmented: boolean;
}

export interface ItemValueProperty {
	value: ItemValue;
	augmented: boolean;
}

export interface ItemProperties {
	weaponPhysicalDamage?: ItemValueProperty;
	weaponElementalDamage?: ItemValueProperty[];
	weaponChaosDamage?: ItemValueProperty;
	weaponCriticalStrikeChance?: ItemValueProperty;
	weaponAttacksPerSecond?: ItemValueProperty;
	weaponRange?: ItemProperty;
	shieldBlockChance?: ItemValueProperty;
	armourArmour?: ItemValueProperty;
	armourEvasionRating?: ItemValueProperty;
	armourEnergyShield?: ItemValueProperty;
	armourSpirit?: ItemValueProperty;
	stackSize?: ItemValueProperty;
	gemLevel?: ItemValueProperty;
	gemQualityType?: ItemGemQualityType;
	quality?: ItemValueProperty;
	qualityType?: ItemQualityType;
	areaLevel?: ItemValueProperty;
	mapTier?: ItemValueProperty;
	mapBonus?: ItemValueProperty;
}

export enum ItemQualityType {
	Default = 0,
}

export enum ItemGemQualityType {
	Default = 0,
}

export interface ItemRequirements {
	level?: number;
	int?: number;
	str?: number;
	dex?: number;
}

// aka 'Mod Generation Type'
export enum StatGenType {
	Unknown = 0,
	Prefix = 1,
	Suffix = 2,
	// Others are omitted due to irrelevance.
}

export interface ItemStat {
	id?: string;
	predicateIndex: number;
	predicate: string;
	tradeId: string;
	mod?: string;
	negated?: boolean;
	genType?: StatGenType;
	type: StatType;
	values: ItemValue[];
	option?: boolean;
	indistinguishables?: string[];
	relatedStats?: ItemStat[];
	modName?: string;
}

export interface ExportedItem {
	sections: Section[];
}

export interface Section {
	content: string;
	lines: string[];
}

export interface ItemSectionParserService {
	section: ItemSection;
	optional: boolean;
	parse(item: ExportedItem, target: Item): Section | Section[] | null;
}

export enum ItemSection {
	Corrupted,
	Mirrored,
	Unidentified,
	ItemLevel,
	Note,
	Properties,
	Rartiy,
	Requirements,
	Sockets,
	Stats,
	Flask,
	Relic,
}

export interface ItemSearchFiltersService {
	add(item: Item, language: Language, query: Query): void;
}

export interface ItemProcessorOptions {
	normalizeQuality: boolean;
}

export interface ItemCategoryValue {
	name: string;
	type: string | undefined;
	mapTier: number | undefined;
	levelRequired: number | undefined;
	links: number | undefined;
	gemLevel: number | undefined;
	gemQuality: number | undefined;
	corrupted: boolean | undefined;
	relic: boolean | undefined;
	chaosAmount: number;
	change: number;
	history: number[];
	url: string;
}

export interface ItemCategoryValues {
	values: ItemCategoryValue[];
}
