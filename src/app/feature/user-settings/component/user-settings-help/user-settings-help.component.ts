import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrowserService } from '@core/service';
import { MaterialModule } from '@shared/material/material.module';
import { SharedModule } from '@shared/shared.module';

@Component({
	selector: 'app-user-settings-help',
	templateUrl: './user-settings-help.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class UserSettingsHelpComponent {
	constructor(
		private readonly browser: BrowserService
	) {
	}

	public openUrl(url: string): void {
		this.browser.open(url, true);
	}
}
