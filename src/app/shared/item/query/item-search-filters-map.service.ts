import { Injectable } from '@angular/core';
import { Item, ItemSearchFiltersService } from '@shared/item/type';
import { Query } from '@shared/poe-api';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSearchFiltersMapService implements ItemSearchFiltersService {
	public add(item: Item, language: Language, query: Query): void {
		if (!item.properties) {
			return;
		}

		query.filters!.map_filters = {
			filters: {},
		};

		const prop = item.properties;
		if (prop.mapTier) {
			query.filters!.map_filters.filters!.map_tier = {
				min: prop.mapTier.value.value,
				max: prop.mapTier.value.value,
			};
		}

		if (prop.mapBonus) {
			query.filters!.map_filters.filters!.map_bonus = {
				min: prop.mapBonus.value.value,
			};
		}
	}
}
