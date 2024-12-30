import { ItemCategory } from '@shared/item/type';
import { Stat } from '@shared/stats/type';

export type ClientStringMap = Record<string, string>;

export type WordMap = Record<string, string>;

export type BaseItemTypeNameMap = Record<string, string>;

export type BaseItemTypeMap = Record<string, BaseItemType>;

export interface BaseItemType {
	names?: BaseItemTypeNameMap;
	image?: string;
	category?: ItemCategory;
	width?: number;
	height?: number;
}

export type BaseItemTypeCategoryMap = Record<string, ItemCategory>;

export type StatMap = Record<string, Stat>;

export type StatLocalMap = Record<string, string>;

export type StatIndistinguishableMap = Record<string, string[]>;

export interface ModValue {
	min: number;
	max: number;
}

export type ModsMap = Record<string, Record<string, ModValue[]>>;

export interface AtlasMap {
	url?: string;
	layoutRating?: string;
	bossRating?: string;
	bosses?: string[];
	bossCount?: number;
	items?: AtlasMapItem[];
	encounter?: string;
	layout?: string;
}

export interface AtlasMapItem {
	item?: string;
	dropLevel?: number;
}

export type AtlasMapsMap = Record<string, AtlasMap>;
