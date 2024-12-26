import { Color } from '@core/class/color.class';
import { TradeItemLocation } from '@feature/stash-grid/type/stash-grid.type';
import { Rectangle, UserSettings, Currency, AudioClipSettings } from '@shared/type';

export const TradeNotificationPanelShortcutRef = 'trade-notifications-panel';

export const DefaultAskIfStillInterestedMessage = 'Hi, are you still interested in @item for @price?';

export type EnumDictionary<T extends string | symbol | number, U> = Record<T, U>;

export interface TradeCompanionUserSettings extends UserSettings {
	tradeCompanionEnabled: boolean;
	tradeCompanionOpacity: number;
	tradeCompanionBounds?: Rectangle;
	maxVisibileTradeNotifications: number;
	incomingTradeOptions: TradeCompanionButtonOption[];
	outgoingTradeOptions: TradeCompanionButtonOption[];
	showStashGridOnInvite: boolean;
	hideStashGridOnTrade: boolean;
	reversedNotificationHorizontalAlignment: boolean;
	reversedNotificationDirection: boolean;
	buttonClickAudio: AudioClipSettings;
	incomingTradeMessageAudio: AudioClipSettings;
	autoCollapseIncomingTradeNotifications: TradeNotificationAutoCollapseType;
	autoCollapseOutgoingTradeNotifications: TradeNotificationAutoCollapseType;
	tradeNotificationKeybindings: TradeNotificationKeybindings;
	activeTradeNotificationBorderColor: Color;
	askIfStillInterestedMessage: string;
}

export interface TradeNotificationKeybindings {
	// General
	activateNextTradeNotification?: string;
	activatePreviousTradeNotification?: string;
	dismiss?: string;
	collapse?: string;
	offerTrade?: string;
	whisper?: string;
	// Incoming
	inviteToParty?: string;
	kickFromParty?: string;
	askStillInterested?: string;
	// Outgoing
	joinHideout?: string;
	leaveParty?: string;
	whois?: string;
	repeatWhisper?: string;
}

export enum TradeNotificationAutoCollapseType {
	None = 0,
	Oldest = 1,
	Newest = 2,
	All = 3,
}

export interface TradeCompanionButtonOption {
	buttonLabel: string;
	whisperMessage: string;
	kickAfterWhisper: boolean;
	dismissNotification: boolean;
	collapseNotification: boolean;
	keybinding?: string;
}

export enum ExampleNotificationType {
	Item = 0,
	Currency = 1,
}

export enum TradeNotificationType {
	Incoming = 0,
	Outgoing = 1,
}

export interface TradeNotification {
	text: string;
	type: TradeNotificationType;
	time: Date;
	playerName: string;
	item: string | CurrencyAmount;
	itemLocation?: TradeItemLocation;
	price: CurrencyAmount;
	offer?: string;
	playerInHideout?: boolean;
	playerLeftHideout?: boolean;
	defaultCollapsed?: boolean;
	userCollapsed?: boolean;
}

export interface CurrencyAmount {
	amount: number;
	currency: Currency;
}

export interface TradeRegexes {
	all: string;
	joinedArea: Record<string, string>;
	leftArea: Record<string, string>;
	whisper: string;
	tradeItemPrice: Record<string, string>;
	tradeItemNoPrice: Record<string, string>;
	tradeBulk: Record<string, string>;
	tradeMap: string;
}
