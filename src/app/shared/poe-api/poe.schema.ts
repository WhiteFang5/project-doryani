export interface TradeResponse<TResult> {
	result: TResult[];
}

// Obtained from https://www.pathofexile.com/api/trade2/data/leagues
export interface TradeLeaguesResult {
	id: string;
	text: string;
	realm: string;
}

// Obtained from https://www.pathofexile.com/api/trade2/data/static
export interface TradeStaticResult {
	id: TradeStaticResultId;
	label?: string;
	entries: TradeStaticResultEntry[];
}

export interface TradeStaticResultEntry {
	id: string;
	text: string;
	image?: string;
}

// Obtained from https://www.pathofexile.com/api/trade2/data/static
export enum TradeStaticResultId {
	Currency = 'Currency',
	Fragments = 'Fragments',
	Runes = 'Runes',
	Essences = 'Essences',
	Relics = 'Relics',
	Ultimatum = 'Ultimatum',
	BreachCatalyst = 'BreachCatalyst',
	Expedition = 'Expedition',
	Ritual = 'Ritual',
	DeliriumInstill = 'DeliriumInstill',
	Waystones = 'Waystones',
	Misc = 'Misc',
}

export interface TradeStatsResult {
	label: TradeStatsResultLabel;
	entries: TradeStatsResultResultEntry[];
}

// Obtained from https://www.pathofexile.com/api/trade2/data/stats
export enum TradeStatsResultLabel {
	Explicit = 'Explicit',
	Implicit = 'Implicit',
	Enchant = 'Enchant',
	Rune = '',// Yes it's explicitly empty
	Sanctum = 'Sanctum',
	Skill = 'Skill',
}

export interface TradeStatsResultResultEntry {
	id?: string;
	text?: string;
	type?: string;
}

//{"error":{"code":8,"message":"Unauthorized"}}
export interface ApiErrorResponse {
	error?: {
		code?: number;
		message?: string;
	};
}

//{"uuid":"[GUID]","name":"[ACC NAME]","realm":"pc","locale":"en_US","guild":{"name":"[GUILD NAME]"},"twitch":{"name":"[TWITCH ACC NAME]"}}
export interface ApiProfileResponse {
	uuid?: string;
	name?: string;
	realm?: string;
	locale?: string;
	guild?: ApiGuildEntry;
	twitch?: ApiTwitchEntry;
}

export interface ApiGuildEntry {
	name?: string;
}

export interface ApiTwitchEntry {
	name?: string;
}

export interface ApiCharacterResponse {
	name?: string;
	league?: string;
	classId?: number;
	ascendancyClass?: number;
	class?: string;
	level?: number;
	experience?: number;
	lastActive?: boolean;
}

export interface FilterValueOption {
	option?: string | number;
	min?: number;
	max?: number;
}

export interface FilterOption {
	option?: string;
}

export interface FilterGroup<TFilter> {
	filters?: TFilter;
}

export interface StatsFilter {
	id?: string;
	value?: FilterValueOption;
	disabled?: boolean;
}

export interface StatsGroup {
	type?: string;
	min?: number;
	max?: number;
	filters?: StatsFilter[];
}

export interface TypeFilters {
	category?: FilterOption;
	rarity?: FilterOption;
	ilvl?: FilterValueOption;
	quality?: FilterValueOption;
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export interface EquipmentFilters {
	damage?: FilterValueOption;
	aps?: FilterValueOption;
	crit?: FilterValueOption;
	dps?: FilterValueOption;
	pdps?: FilterValueOption;
	edps?: FilterValueOption;
	ar?: FilterValueOption;
	ev?: FilterValueOption;
	es?: FilterValueOption;
	block?: FilterValueOption;
	spirit?: FilterValueOption;
	rune_sockets?: FilterValueOption;
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export interface ReqFilters {
	lvl?: FilterValueOption;
	str?: FilterValueOption;
	dex?: FilterValueOption;
	int?: FilterValueOption;
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export interface MapFilters {
	map_tier?: FilterValueOption;
	map_bonus?: FilterValueOption;
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export interface MiscFilters {
	gem_level?: FilterValueOption;
	gem_sockets?: FilterValueOption;
	area_level?: FilterValueOption;
	stack_size?: FilterValueOption;
	identified?: FilterOption;
	corrupted?: FilterOption;
	mirrored?: FilterOption;
	alternate_art?: FilterOption;
	sanctum_gold?: FilterOption;
	unidentified_tier?: FilterOption;
}

// Obtained from https://pathofexile.com/api/trade2/data/filters
export interface TradeFilters {
	price?: FilterOption;
	sale_type?: FilterOption;
	indexed?: FilterOption;
}

export interface TradeFilterGroup extends FilterGroup<TradeFilters> {
	disabled?: boolean;
}

export interface Filters {
	type_filters?: FilterGroup<TypeFilters>;
	equipment_filters?: FilterGroup<EquipmentFilters>;
	req_filters?: FilterGroup<ReqFilters>;
	map_filters?: FilterGroup<MapFilters>;
	misc_filters?: FilterGroup<MiscFilters>;
	trade_filters?: TradeFilterGroup;
}

export interface Query {
	status?: FilterOption;
	name?: FilterOptionDiscriminator;
	type?: FilterOptionDiscriminator;
	term?: string;
	stats?: StatsGroup[];
	filters?: Filters;
}

export interface FilterOptionDiscriminator extends FilterOption {
	discriminator?: string;
}

export interface Exchange {
	status?: FilterOption;
	want?: string[];
	have?: string[];
}

// poe 1 stuff?
export enum ExchangeEngine {
	Legacy = 'legacy',// Note: no longer supported by GGG since 17/05/2022
	New = 'new'
}

export interface Sort {
	price?: string;
}

export interface TradeSearchRequest {
	query: Query;
	sort: Sort;
}

export interface SearchResponse {
	searchType: TradeSearchType;
	id: string;
	url: string;
	total: number;
}

export interface TradeSearchResponse extends SearchResponse {
	result: string[];
}

export interface ExchangeSearchResponse extends SearchResponse {
	result: Record<string, ExchangeFetchResult>;
}

export interface ExchangeSearchRequest {
	exchange: Exchange;
	engine: ExchangeEngine;
}

export interface TradeFetchResultPrice {
	type: string;
	amount: number;
	currency: string;
}

export interface TradeFetchResultAccount {
	name: string;
}

export interface TradeFetchResultListing {
	indexed: string;
	price: TradeFetchResultPrice;
	account: TradeFetchResultAccount;
}

interface TradeFetchResultItem {
	note?: string;
}

export interface TradeFetchResult {
	id: string;
	listing: TradeFetchResultListing;
	item: TradeFetchResultItem;
}

export interface ExchangeResultItem {
	currency: string;
	amount: number;
}

export interface ExchangeResultItemStock extends ExchangeResultItem {
	id: string;
	stock: number;
}

export interface ExchangeResultOffer {
	exchange: ExchangeResultItem;
	item: ExchangeResultItemStock;
}

export interface ExchangeResultListing {
	indexed: string;
	account: TradeFetchResultAccount;
	offers: ExchangeResultOffer[];
}

export interface ExchangeFetchResult {
	id: string;
	listing: ExchangeResultListing;
}

export enum TradeSearchType {
	NormalTrade = 'search',
	BulkExchange = 'exchange',
}
