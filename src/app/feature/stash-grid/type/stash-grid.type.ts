import { Color } from '@core/class/color.class';
import { ItemCategory } from '@shared/item/type';
import { Rectangle, UserSettings } from '@shared/type';

export interface StashGridUserSettings extends UserSettings {
	stashGridBounds: Rectangle[];
	stashGrids: Map<string, StashGridType>;
	stashGridColors: StashGridColors;
}

export interface StashGridColors {
	gridLine: Color;
	gridOutline: Color;
	gridBackground: Color;
	highlightLine: Color;
	highlightBackground: Color;
	highlightText: Color;
}

export enum StashGridType {
	Normal = 0,
	Quad = 1,
	Currency = 2,
	Essence = 3,
	Metamorph = 4,
	Delirium = 5,
}

export enum StashGridMode {
	Normal = 0,
	Edit = 1,
	Preview = 2,
}

export interface StashGridOptions {
	gridMode: StashGridMode;
	gridType: StashGridType;
	gridBounds?: Rectangle;
	highlightLocation?: TradeItemLocations;
	autoClose?: boolean;
	settings?: StashGridUserSettings;    // Can be used to preview settings from within the settings window without applying them first
}

export type StashTabLayoutMap = Record<string, StashTabLayoutData>;

export interface StashTabLayoutData {
	xOffset: number;
	yOffset: number;
	width: number;
	height: number;
	showIfEmpty: boolean;
}

export interface TradeItemLocations {
	tabName: string;
	bounds: Rectangle[];
}

export interface TradeItemLocation {
	tabName: string;
	bounds: Rectangle;
}

export const MAX_STASH_SIZE = 24;

export const STASH_TAB_CELL_COUNT_MAP = {
	[StashGridType.Normal]: 12,
	[StashGridType.Quad]: 24,
};

export const STASH_GRID_TYPE_MAP = {
	[StashGridType.Currency]: 'currency-general',
	[StashGridType.Essence]: 'essence',
	[StashGridType.Metamorph]: 'metamorph',
	[StashGridType.Delirium]: 'delirium',
};

export const STASH_GRID_TYPE_TO_ITEM_CATEGORY_MAP = {
	[StashGridType.Currency]: ItemCategory.Currency,
	[StashGridType.Essence]: ItemCategory.Currency,
	[StashGridType.Metamorph]: ItemCategory.Currency,
	[StashGridType.Delirium]: ItemCategory.Currency,
};
