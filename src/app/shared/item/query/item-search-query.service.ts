import { Injectable } from '@angular/core';
import { Item, ItemSearchFiltersService } from '@shared/item/type';
import { Query } from '@shared/poe-api';
import { Language } from '@shared/type';
import { ItemSearchFiltersEquipmentService } from './item-search-filters-equipment.service';
import { ItemSearchFiltersMapService } from './item-search-filters-map.service';
import { ItemSearchFiltersMiscsService } from './item-search-filters-miscs.service';
import { ItemSearchFiltersRequirementsService } from './item-search-filters-requirements.service';
import { ItemSearchFiltersStatsService } from './item-search-filters-stats.service';
import { ItemSearchFiltersTypeService } from './item-search-filters-type.service';

@Injectable({
	providedIn: 'root',
})
export class ItemSearchQueryService {
	private readonly filters: ItemSearchFiltersService[];

	constructor(
		filtersTypeService: ItemSearchFiltersTypeService,
		filtersEquipmentService: ItemSearchFiltersEquipmentService,
		filtersRequirementsService: ItemSearchFiltersRequirementsService,
		filtersMiscsService: ItemSearchFiltersMiscsService,
		filtersMapService: ItemSearchFiltersMapService,
		filtersStatsService: ItemSearchFiltersStatsService,
	) {
		this.filters = [
			filtersTypeService,
			filtersEquipmentService,
			filtersRequirementsService,
			filtersMapService,
			filtersMiscsService,
			filtersStatsService,
		];
	}

	public map(item: Item, language: Language, query: Query): void {
		this.filters.forEach((filter) => filter.add(item, language, query));
	}
}
