import { NgModule, Injectable } from '@angular/core';
import { FEATURES_TOKEN } from '@core/token';
import { Feature, FeatureModule, UserSettings, UserSettingsFeature } from '@shared/type';
import { SharedModule } from '@shared/shared.module';
import { CommandService } from './service/command.service';
import { CommandUserSettings } from './type/command.type';
import { CommandSettingsComponent } from '@feature/command/component/command-settings/command-settings.component';

@NgModule({
	providers: [{ provide: FEATURES_TOKEN, useClass: CommandModule, multi: true }],
	declarations: [CommandSettingsComponent],
	imports: [SharedModule],
})
export class CommandModule implements FeatureModule {
	constructor(private readonly commandService: CommandService) { }

	public getSettings(): UserSettingsFeature {
		const defaultSettings: CommandUserSettings = {
			commands: [
				{
					text: '/hideout',
					shortcut: 'F5',
				},
				{
					text: '/dnd',
					shortcut: 'F6',
				},
			],
		};
		return {
			name: 'command.name',
			component: CommandSettingsComponent,
			defaultSettings,
			visualPriority: 20,
		};
	}

	public getFeatures(settings: CommandUserSettings): Feature[] {
		return settings.commands
			.filter((command) => command.text && command.shortcut)
			.map((command) => {
				const feature: Feature = {
					name: command.text,
					accelerator: command.shortcut,
				};
				return feature;
			});
	}

	public run(feature: string, settings: UserSettings): void {
		this.commandService.command(feature, settings, true);
	}
}
