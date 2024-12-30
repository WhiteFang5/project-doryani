import { Injectable } from '@angular/core';
import { Item, ItemSearchFiltersService, ItemSocket, ItemSocketColor } from '@shared/item/type';
import { EquipmentFilters, FilterGroup, Query } from '@shared/poe-api';
import { Language } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class ItemSearchFiltersEquipmentService implements ItemSearchFiltersService {
	public add(item: Item, _: Language, query: Query): void {
		if (!item.properties) {
			return;
		}

		const equipment_filters: FilterGroup<EquipmentFilters> = {
			filters: {},
		};

		query.filters!.equipment_filters = equipment_filters;

		const { damage } = item;
		if (damage) {
			const { dps, edps, pdps } = damage;
			if (dps) {
				equipment_filters.filters!.dps = {
					min: dps.min,
					max: dps.max,
				};
			}
			if (edps) {
				equipment_filters.filters!.edps = {
					min: edps.min,
					max: edps.max,
				};
			}
			if (pdps) {
				equipment_filters.filters!.pdps = {
					min: pdps.min,
					max: pdps.max,
				};
			}
		}

		if (item.properties) {
			const { weaponAttacksPerSecond } = item.properties;
			if (weaponAttacksPerSecond) {
				const { value } = weaponAttacksPerSecond;
				equipment_filters.filters!.aps = {
					min: value.min,
					max: value.max,
				};
			}

			const { weaponCriticalStrikeChance } = item.properties;
			if (weaponCriticalStrikeChance) {
				const { value } = weaponCriticalStrikeChance;
				equipment_filters.filters!.crit = {
					min: value.min,
					max: value.max,
				};
			}
		}

		const { armourArmour } = item.properties;
		if (armourArmour) {
			const { value } = armourArmour;
			equipment_filters.filters!.ar = {
				min: value.min,
				max: value.max,
			};
		}
		const { armourEvasionRating } = item.properties;
		if (armourEvasionRating) {
			const { value } = armourEvasionRating;
			equipment_filters.filters!.ev = {
				min: value.min,
				max: value.max,
			};
		}
		const { armourEnergyShield } = item.properties;
		if (armourEnergyShield) {
			const { value } = armourEnergyShield;
			equipment_filters.filters!.es = {
				min: value.min,
				max: value.max,
			};
		}
		const { armourSpirit } = item.properties;
		if (armourSpirit) {
			const { value } = armourSpirit;
			equipment_filters.filters!.spirit = {
				min: value.min,
				max: value.max,
			};
		}
		const { shieldBlockChance } = item.properties;
		if (shieldBlockChance) {
			const { value } = shieldBlockChance;
			equipment_filters.filters!.block = {
				min: value.min,
				max: value.max,
			};
		}
		const validSockets = (item.sockets || []).filter((x) => !!x);
		if (validSockets.length > 0) {
			const sockets = validSockets.filter((x) => !!x.color);
			if (sockets.length > 0) {
				equipment_filters.filters!.rune_sockets = {
					max: this.getSocketColorCount(validSockets, [ItemSocketColor.Str, ItemSocketColor.Dex, ItemSocketColor.Int, ItemSocketColor.Gen, ItemSocketColor.Any]),
					min: sockets.length,
				};
			}
		}
	}

	private getSocketColorCount(sockets: ItemSocket[], colors: ItemSocketColor[]): number | undefined {
		if (!sockets) {
			return undefined;
		}
		const count = sockets.filter(socket => colors.some(c => c === socket.color)).length;
		if (count == 0) {
			const containsAny = sockets.some(socket => socket.color == ItemSocketColor.Any);
			const hasUnselectedSockets = sockets.some(socket => socket.color !== undefined);
			// Use undefined (i.e. exclude from search) when there's an unselected or an 'any' socket color selected; otherwise explicitly use zero
			return (containsAny || hasUnselectedSockets) ? undefined : 0;
		}
		return count;
	}
}
