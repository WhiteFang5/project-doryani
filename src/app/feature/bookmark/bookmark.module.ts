import { NgModule } from '@angular/core';
import { FEATURES_TOKEN } from '@core/token';
import { SharedModule } from '@shared/shared.module';
import { Feature, FeatureModule, UserSettingsFeature } from '@shared/type';
import { BookmarkSettingsComponent } from './component/bookmark-settings/bookmark-settings.component';
import { BookmarkService } from './service/bookmark.service';
import { BookmarkUserSettings } from './type/bookmark.type';

@NgModule({
	providers: [{ provide: FEATURES_TOKEN, useClass: BookmarkModule, multi: true }],
	declarations: [BookmarkSettingsComponent],
	imports: [SharedModule],
})
export class BookmarkModule implements FeatureModule {
	constructor(private readonly bookmarkService: BookmarkService) { }

	public getSettings(): UserSettingsFeature {
		const defaultSettings: BookmarkUserSettings = {
			bookmarks: [
				{
					url: 'https://www.poelab.com/',
					shortcut: 'Alt + num1',
					external: false,
				},
				{
					url: 'https://wraeclast.com/',
					shortcut: 'Alt + num2',
					external: false,
				},
			],
		};
		return {
			name: 'bookmark.name',
			component: BookmarkSettingsComponent,
			defaultSettings,
			visualPriority: 10,
		};
	}

	public getFeatures(settings: BookmarkUserSettings): Feature[] {
		return settings.bookmarks
			.filter((bookmark) => bookmark.url && bookmark.shortcut)
			.map((bookmark, index) => {
				const feature: Feature = {
					name: `bookmark-${index}`,
					accelerator: bookmark.shortcut,
				};
				return feature;
			});
	}

	public run(feature: string, settings: BookmarkUserSettings): void {
		const index = +feature.split('-')[1];
		const bookmark = settings.bookmarks[index];
		this.bookmarkService.open(bookmark);
	}
}
