import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommandUserSettings } from '@feature/command/type/command.type';
import { UserSettingsComponent } from '@shared/type';

@Component({
	selector: 'app-command-settings',
	templateUrl: './command-settings.component.html',
	styleUrls: ['./command-settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class CommandSettingsComponent implements UserSettingsComponent {
	@Input()
	public settings!: CommandUserSettings;

	@Input()
	public defaultSettings!: CommandUserSettings;

	public load(): void {
		// stub
	}

	public onAddCommandClick(): void {
		this.addCommand();
	}

	public onRemoveClick(index: number): void {
		this.removeCommand(index);
	}

	private addCommand(): void {
		this.settings.commands.push({
			text: '/',
			shortcut: undefined,
		});
	}

	private removeCommand(index: number): void {
		this.settings.commands.splice(index, 1);
	}
}
