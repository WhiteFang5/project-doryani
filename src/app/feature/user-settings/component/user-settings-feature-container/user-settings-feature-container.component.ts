import {
    ChangeDetectionStrategy,
    Component,
    ComponentRef,
    Input,
    OnDestroy,
    OnInit,
    Type,
    ViewContainerRef,
} from '@angular/core';
import { UserSettings, UserSettingsComponent } from '@shared/type';

@Component({
	selector: 'app-user-settings-feature-container',
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsFeatureContainerComponent implements OnInit, OnDestroy {
	private componentRef?: ComponentRef<UserSettingsComponent>;

	@Input()
	public component?: Type<UserSettingsComponent>;

	@Input()
	public settings!: UserSettings;

	@Input()
	public defaultSettings!: UserSettings;

	public get instance(): UserSettingsComponent | null {
		return this.componentRef ? this.componentRef.instance : null;
	}

	constructor(
		private readonly viewContainerRef: ViewContainerRef,
	) { }

	public ngOnInit(): void {
		if (!this.component) {
			return;
		}

		this.componentRef = this.viewContainerRef.createComponent(this.component);
		const instance = this.instance;
		if (instance) {
			instance.settings = this.settings;
			instance.defaultSettings = this.defaultSettings;
			instance.load();
		}
	}

	public ngOnDestroy(): void {
		if (this.componentRef) {
			this.componentRef.destroy();
			this.componentRef = undefined;
		}
	}
}
