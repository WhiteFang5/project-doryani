import { StatType } from "@shared/type";

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
	veiled?: boolean;
	blighted?: boolean;
	blightRavaged?: boolean;
	relic?: boolean;
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

export interface ItemSocket {
	color: ItemSocketColor;
	linked: boolean;
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
	armourWard?: ItemValueProperty;
	stackSize?: ItemValueProperty;
	gemLevel?: ItemValueProperty;
	gemQualityType?: ItemGemQualityType;
	quality?: ItemValueProperty;
	qualityType?: ItemQualityType;
	gemExperience?: ItemValueProperty;
	areaLevel?: ItemValueProperty;
	mapTier?: ItemValueProperty;
	mapQuantity?: ItemValueProperty;
	mapRarity?: ItemValueProperty;
	mapPacksize?: ItemValueProperty;
	durability?: ItemValueProperty;
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
	id: string;
	predicateIndex: number;
	predicate: string;
	tradeId: string;
	mod: string;
	negated: boolean;
	genType?: StatGenType;
	type: StatType;
	values: ItemValue[];
	option: boolean;
	indistinguishables: string[];
	relatedStats?: ItemStat[];
	modName?: string;
}
