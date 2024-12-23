import {
    ChangeDetectionStrategy,
    Component, HostListener, Inject, OnDestroy, OnInit,
    QueryList,
    ViewChildren
} from '@angular/core';
import { ElectronProvider } from '@core/provider';
import { AppTranslateService, WindowService } from '@core/service';
import { FEATURES_TOKEN } from '@core/token';
import { UserSettingsFeatureContainerComponent } from '@feature/user-settings/component/user-settings-feature-container/user-settings-feature-container.component';
import { UserSettingsFormComponent } from '@feature/user-settings/component/user-settings-form/user-settings-form.component';
import { UserSettingsHelpComponent } from '@feature/user-settings/component/user-settings-help/user-settings-help.component';
import { UserSettingsService } from '@feature/user-settings/service';
import { IpcChannels } from '@ipc-consts';
import { MaterialModule } from '@shared/material/material.module';
import { PoEAccountService } from '@shared/poe-account/service/poe-account.service';
import { ContextService } from '@shared/service';
import { SharedModule } from '@shared/shared.module';
import { Context, DEFAULT_USER_SETTINGS, FeatureModule, UserSettings, UserSettingsFeature } from '@shared/type';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';

@Component({
	selector: 'app-user-settings',
	styleUrls: ['./user-settings.component.scss'],
	templateUrl: './user-settings.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		UserSettingsFormComponent,
		UserSettingsFeatureContainerComponent,
		UserSettingsHelpComponent
	],
})
export class UserSettingsComponent implements OnInit, OnDestroy {
	public init$ = new BehaviorSubject<boolean>(false);

	public settings?: UserSettings;
	public features!: UserSettingsFeature[];

	@ViewChildren(UserSettingsFeatureContainerComponent)
	public containers!: QueryList<UserSettingsFeatureContainerComponent>;

	constructor(
		@Inject(FEATURES_TOKEN)
		private readonly modules: FeatureModule[],
		private readonly settingsService: UserSettingsService,
		private readonly window: WindowService,
		private readonly context: ContextService,
		private readonly translate: AppTranslateService,
		private readonly accountService: PoEAccountService,
		private readonly electronProvider: ElectronProvider,
	) {
		const ipcRenderer = this.electronProvider.provideIpcRenderer();
		ipcRenderer.on(IpcChannels.WindowCloseReq, () => {
			this.save().subscribe(() => {
				ipcRenderer.send(IpcChannels.WindowCloseReq, true);
			});
		});
	}

	@HostListener('window:beforeunload', [])
	public onWindowBeforeUnload(): void {
		this.reset();
	}

	public ngOnInit(): void {
		this.init();
	}

	public ngOnDestroy(): void {
		this.reset();
	}

	public onSelectedIndexChange(index: number): void {
		const containerIndex = index - 1;
		const container = this.containers.toArray()[containerIndex];
		if (container && container.instance) {
			container.instance.load();
		}
	}

	public onSave(): void {
		this.save().subscribe(() => {
			this.window.close();
		});
	}

	private init(): void {
		this.settingsService.init(this.modules).subscribe((settings) => {
			this.translate.use(settings.uiLanguage!);
			this.window.setZoom((settings.zoom!) / 100);

			this.context.init(this.getContext(settings)).subscribe(() => {
				this.accountService.register(settings).subscribe(() => {
					this.settings = settings;
					this.features = [...this.settingsService.features()].sort(
						(a, b) => b.visualPriority - a.visualPriority
					);

					this.init$.next(true);
				});
			});
		});
	}

	private reset(): void {
		this.accountService.unregister();
	}

	private save(): Observable<boolean> {
		if (this.init$.value && this.settings) {
			this.translate.use(this.settings.uiLanguage!);
			this.window.setZoom(this.settings.zoom! / 100);

			this.context.update(this.getContext(this.settings));

			return this.settingsService.save(this.settings).pipe(
				map(() => true),
				catchError(() => of(false))
			);
		}
		return of(true);
	}

	private getContext(settings: UserSettings): Context {
		return {
			language: settings.language!,
			gameLanguage: settings.gameLanguage,
			leagueId: settings.leagueId,
		};
	}
}
