import { Injectable } from '@angular/core';
import { Item, ItemStat, ItemValueProperty } from '@shared/item/type';

const QUALITY_MAX = 20;

@Injectable({
	providedIn: 'root',
})
export class ItemQualityProcessorService {
	public process(item: Item, normalizeQuality: boolean): void {
		const { properties, stats, corrupted, mirrored } = item;
		if (!properties || !stats || corrupted || mirrored) {
			return;
		}

		const quality = properties.quality ? this.parseValue(properties.quality.value.text) : 0;

		const increasedQuality = this.calculateModifier(stats, 'local_item_quality_+');

		const { armourArmour } = properties;
		if (armourArmour) {
			const increasedArmour = this.calculateModifier(
				stats,
				'local_physical_damage_reduction_rating_+%',
				'local_armour_and_energy_shield_+%',
				'local_armour_and_evasion_+%',
				'local_armour_and_evasion_and_energy_shield_+%'
			);
			this.calculateQualityTier(
				armourArmour,
				quality,
				increasedQuality,
				increasedArmour,
				normalizeQuality
			);
		}

		const { armourEvasionRating } = properties;
		if (armourEvasionRating) {
			const increasedEvasionRating = this.calculateModifier(
				stats,
				'local_evasion_rating_+%',
				'local_armour_and_evasion_+%',
				'local_armour_and_evasion_and_energy_shield_+%',
				'local_evasion_and_energy_shield_+%',
			);
			this.calculateQualityTier(
				armourEvasionRating,
				quality,
				increasedQuality,
				increasedEvasionRating,
				normalizeQuality
			);
		}

		const { armourEnergyShield } = properties;
		if (armourEnergyShield) {
			const increasedEnergyShield = this.calculateModifier(
				stats,
				'local_energy_shield_+%',
				'local_armour_and_energy_shield_+%',
				'local_armour_and_evasion_and_energy_shield_+%',
				'local_evasion_and_energy_shield_+%',
			);
			this.calculateQualityTier(
				armourEnergyShield,
				quality,
				increasedQuality,
				increasedEnergyShield,
				normalizeQuality
			);
		}

		const { armourSpirit } = properties;
		if (armourSpirit) {
			const increasedWard = this.calculateModifier(
				stats,
			);
			this.calculateQualityTier(
				armourSpirit,
				quality,
				increasedQuality,
				increasedWard,
				normalizeQuality
			);
		}

		const { weaponPhysicalDamage } = properties;
		if (weaponPhysicalDamage) {
			const increasedPhysicalDamage = this.calculateModifier(
				stats,
				'local_physical_damage_+% local_weapon_no_physical_damage'
			);
			this.calculateQualityTier(
				weaponPhysicalDamage,
				quality,
				increasedQuality,
				increasedPhysicalDamage,
				normalizeQuality
			);
		}
	}

	private calculateModifier(stats: ItemStat[], ...statIds: string[]): number {
		return stats
			.filter((x) => x.id && statIds.includes(x.id) && x.values && x.values.length)
			.map((x) => +x.values[0].text.replace('%', ''))
			.filter((x) => !isNaN(x))
			.reduce((a, b) => a + b, 0);
	}

	private calculateQualityTier(
		property: ItemValueProperty,
		quality: number,
		increasedQuality: number,
		modifier: number,
		normalizeQuality: boolean
	): void {
		const value = this.parseValue(property.value.text);
		const base = value / (1 + (quality + modifier) / 100);
		const min = this.round(base * (1 + modifier / 100), 1);
		const max = this.round(base * (1 + (Math.max(quality, QUALITY_MAX + increasedQuality) + modifier) / 100), 1);

		if (normalizeQuality) {
			const normalized = this.round(base * (1 + (QUALITY_MAX + modifier) / 100), 1);
			property.value.value = normalized;
		}

		property.value.tier = { min, max };
	}

	private parseValue(text: string): number {
		return text
			.split('-')
			.map((x) => +x.replace('%', ''))
			.reduce((a, b) => a + b, 0);
	}

	private round(value: number, decimalPlaces: number): number {
		const decimalPlacesPow = Math.pow(10, decimalPlaces);
		return Math.floor(value * decimalPlacesPow) / decimalPlacesPow;
	}
}
