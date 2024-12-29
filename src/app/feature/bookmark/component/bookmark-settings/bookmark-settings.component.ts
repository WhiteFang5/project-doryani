import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BookmarkUserSettings } from '@feature/bookmark/type/bookmark.type';
import { UserSettingsComponent } from '@shared/type';

@Component({
	selector: 'app-bookmark-settings',
	templateUrl: './bookmark-settings.component.html',
	styleUrls: ['./bookmark-settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class BookmarkSettingsComponent implements UserSettingsComponent {
	@Input()
	public settings!: BookmarkUserSettings;

	@Input()
	public defaultSettings!: BookmarkUserSettings;

	public load(): void {
		// stub
	}

	public onAddClick(): void {
		this.addBookmark();
	}

	public onFileSelected(event: Event): void {
		const path = (event.target as HTMLInputElement)?.files?.item(0)?.path;
		this.settings.bookmarks.push({
			url: `file:///${path}`,
			shortcut: undefined,
			external: false,
		});
	}

	public onRemoveClick(index: number): void {
		this.removeBookmark(index);
	}

	private addBookmark(): void {
		this.settings.bookmarks.push({
			url: 'https://github.com/WhiteFang5/project-doryani',
			shortcut: undefined,
			external: false,
		});
	}

	private removeBookmark(index: number): void {
		this.settings.bookmarks.splice(index, 1);
	}
}
