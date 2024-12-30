import { Injectable } from '@angular/core';
import { Item, ItemSearchFiltersService } from '@shared/item/type';
import { Query } from '@shared/poe-api';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSearchFiltersMiscsService implements ItemSearchFiltersService {
	public add(item: Item, language: Language, query: Query): void {
		query.filters!.misc_filters = {
			filters: {},
		};

		query.filters!.misc_filters.filters!.corrupted = {
			option: `${!!item.corrupted}`,
		};

		if (item.mirrored) {
			query.filters!.misc_filters.filters!.mirrored = {
				option: `${!item.mirrored}`,
			};
		}

		if (item.unidentified) {
			query.filters!.misc_filters.filters!.identified = {
				option: `${!item.unidentified}`,
			};
		}

		if (!item.properties) {
			return;
		}

		const prop = item.properties;
		if (prop.areaLevel) {
			query.filters!.misc_filters.filters!.area_level = {
				min: prop.areaLevel.value.min,
				max: prop.areaLevel.value.max,
			};
		}

		if (prop.gemLevel) {
			query.filters!.misc_filters.filters!.gem_level = {
				min: prop.gemLevel.value.min,
				max: prop.gemLevel.value.max,
			};
		}
	}
}
