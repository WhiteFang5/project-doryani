import { UserSettingsFeature } from "@shared/type/user-settings-feature.type";
import { UserSettings } from "@shared/type/user-settings.type";

export interface Feature {
	name: string;
	accelerator: string;
}

export interface FeatureModule {
	getSettings(): UserSettingsFeature;
	getFeatures(settings: UserSettings): Feature[];
	run(feature: string, settings: UserSettings): void;
}
