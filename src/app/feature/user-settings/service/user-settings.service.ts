import { Injectable } from '@angular/core';
import { ObjectUtils } from '@core/class/object-utils.class';
import { StorageService } from '@core/service';
import { DEFAULT_USER_SETTINGS, FeatureModule, UserSettings, UserSettingsFeature } from '@shared/type';
import { Observable, map, mergeMap } from 'rxjs';
import { UserSettingsFeatureService } from './user-settings-feature.service';

const USER_SETTINGS_STORAGE_KEY = 'USER_SETTINGS';

@Injectable({
	providedIn: 'root',
})
export class UserSettingsService {
	constructor(
		private readonly storage: StorageService,
		private readonly userSettingsFeatureService: UserSettingsFeatureService
	) {
	}

	public get(): Observable<UserSettings> {
		return this.storage.getOrDefault(USER_SETTINGS_STORAGE_KEY, () => DEFAULT_USER_SETTINGS);
	}

	public save(settings: UserSettings): Observable<UserSettings> {
		return this.storage.save(USER_SETTINGS_STORAGE_KEY, settings);
	}

	public features(): UserSettingsFeature[] {
		return this.userSettingsFeatureService.get();
	}

	public init(modules: FeatureModule[]): Observable<UserSettings> {
		return this.get().pipe(
			mergeMap((savedSettings) => {
				let mergedSettings: UserSettings = DEFAULT_USER_SETTINGS;

				modules.forEach((x) => {
					const featureSettings = x.getSettings();
					mergedSettings = ObjectUtils.merge(mergedSettings, featureSettings.defaultSettings);
					this.userSettingsFeatureService.register(featureSettings);
				});

				mergedSettings = ObjectUtils.merge(mergedSettings, savedSettings);

				return this.save(mergedSettings);
			})
		);
	}

	public update<TUserSettings extends UserSettings>(
		updateFn: (settings: TUserSettings) => UserSettings
	): Observable<TUserSettings> {
		return this.get().pipe(
			mergeMap((settings) =>
				this.save(updateFn(settings as TUserSettings))
			),
			map((settings) => settings as TUserSettings)
		);
	}
}
