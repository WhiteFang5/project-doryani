import {
    ChangeDetectionStrategy,
    Component,
    HostListener, Inject, OnDestroy,
    OnInit
} from '@angular/core';
import { AppService, AppTranslateService, ElectronService, WindowService } from '@core/service';
import { ShortcutService } from '@core/service/input';
import { FEATURES_TOKEN } from '@core/token';
import { UserSettingsService } from '@feature/user-settings/service';
import { IpcChannels } from '@ipc-consts';
import { SnackBarService } from '@shared/material/service';
import { PoEAccountService } from '@shared/poe-account/service/poe-account.service';
import { ContextService } from '@shared/service';
import { SharedModule } from '@shared/shared.module';
import { AppUpdateState, Context, DEFAULT_USER_SETTINGS, FeatureModule, Rectangle, UserSettings, VisibleFlag } from '@shared/type';
import { BehaviorSubject, Observable, debounce, distinctUntilChanged, map, mergeMap, tap, timer } from 'rxjs';

const OverlayCompRef = 'overlay-component';

@Component({
	selector: 'app-overlay',
	templateUrl: './overlay.component.html',
	styleUrls: ['./overlay.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class OverlayComponent implements OnInit, OnDestroy {
	private userSettingsOpen?: Observable<void>;

	public readonly version$ = new BehaviorSubject<string>('');
	public readonly userSettings$ = new BehaviorSubject<UserSettings | null>(null);
	public readonly gameOverlayBounds$: BehaviorSubject<Rectangle>;

	constructor(
		@Inject(FEATURES_TOKEN)
		private readonly modules: FeatureModule[],
		private readonly userSettingsService: UserSettingsService,
		private readonly context: ContextService,
		private readonly translate: AppTranslateService,
		private readonly snackBar: SnackBarService,
		private readonly app: AppService,
		private readonly window: WindowService,
		private readonly electronService: ElectronService,
		private readonly shortcut: ShortcutService,
		private readonly accountService: PoEAccountService,
	) {
		this.gameOverlayBounds$ = new BehaviorSubject<Rectangle>(this.window.getOffsettedGameBounds());
		this.window.gameBounds.subscribe(() => {
			this.gameOverlayBounds$.next(this.window.getOffsettedGameBounds());
		});
	}

	@HostListener('window:beforeunload', [])
	public onWindowBeforeUnload(): void {
		this.reset();
	}

	public ngOnInit(): void {
		console.log('=== Main Overlay ===');

		this.version$.next(this.app.version());
		this.initSettings();
		this.window.enableTransparencyMouseFix();
	}

	public ngOnDestroy(): void {
		this.reset();
	}

	public openUserSettings(): void {
		if (!this.userSettingsOpen) {
			this.userSettingsOpen = this.electronService.open('user-settings');
			this.userSettingsOpen.pipe(mergeMap(() => this.userSettingsService.get())).subscribe({
				next: (settings) => {
					this.userSettingsOpen = undefined;

					this.translate.use(settings.uiLanguage || DEFAULT_USER_SETTINGS.uiLanguage!);
					this.window.setZoom((settings.zoom || DEFAULT_USER_SETTINGS.zoom!) / 100);
					this.context.update(this.getContext(settings));
					this.accountService.register(settings).subscribe(() => {
						this.app.updateAutoDownload(settings.autoDownload || DEFAULT_USER_SETTINGS.autoDownload!);
						this.register(settings);
						this.app.triggerVisibleChange();
					});
				},
				error: () => (this.userSettingsOpen = undefined),
			});
			this.reset();
		} else {
			this.electronService.restore('user-settings');
		}
	}

	/* Private Methods */

	private initSettings(): void {
		this.userSettingsService.init(this.modules).subscribe((settings) => {
			this.translate.use(settings.uiLanguage || DEFAULT_USER_SETTINGS.uiLanguage!);
			this.window.setZoom((settings.zoom || DEFAULT_USER_SETTINGS.zoom!) / 100);

			this.context.init(this.getContext(settings)).subscribe(() => {
				this.accountService.register(settings).subscribe(() => {
					this.registerEvents(settings);
					this.register(settings);
					this.registerVisibleChange();

					this.electronService.on(IpcChannels.ShowUserSettings, () => {
						this.openUserSettings();
					});
					this.electronService.on(IpcChannels.ResetZoom, () => {
						this.userSettingsService
							.update((x) => {
								x.zoom = 100;
								return x;
							})
							.subscribe((x) => {
								this.window.setZoom((x.zoom || DEFAULT_USER_SETTINGS.zoom!) / 100);
							});
					});
				});
			});
		});
	}

	private reset(): void {
		//this.dialogRef.reset();
		this.accountService.unregister();
		//this.stashService.unregister();
		//this.vendorRecipeService.unregister();
		this.shortcut.removeAllByRef(OverlayCompRef);
		//this.shortcut.removeAllByRef(TradeNotificationPanelShortcutRef)
	}

	private registerEvents(settings: UserSettings): void {
		this.app.updateStateChange().subscribe((event) => {
			switch (event) {
				case AppUpdateState.Available:
					this.snackBar.info('app.update.available');
					break;
				case AppUpdateState.Downloaded:
					this.snackBar.success('app.update.downloaded');
					break;
				default:
					break;
			}
		});
		this.app.registerEvents(settings.autoDownload || DEFAULT_USER_SETTINGS.autoDownload!);
		this.window.registerEvents();
	}

	private registerVisibleChange(): void {
		this.app
			.visibleChange()
			.pipe(
				tap((flag) => this.shortcut.check(flag)),
				tap((flag) => console.log(`flag: ${flag}`)),
				map((flag) => flag !== VisibleFlag.None),
				debounce(() => timer(1500)),
				distinctUntilChanged()
			).subscribe((show) => {
				console.log(`show? ${show}`);
				if (show) {
					this.window.show();
				} else {
					this.window.hide();
				}
			});
		this.app.triggerVisibleChange();
	}

	private register(settings: UserSettings): void {
		this.registerFeatures(settings);
		this.registerSettings(settings);

		this.userSettings$.next(settings);
		this.electronService.send(IpcChannels.UserSettingsChanged);
	}

	private registerFeatures(settings: UserSettings): void {
		this.modules.forEach((mod) => {
			const features = mod.getFeatures(settings);
			features.forEach((feature) => {
				if (feature.accelerator) {
					this.shortcut
						.add(
							feature.accelerator,
							OverlayCompRef,
							!!feature.passive,
							VisibleFlag.Game,
							VisibleFlag.Overlay
						)
						.subscribe(() => {
							mod.run(feature.name, settings);
						});
				}
			});
		});
	}

	private registerSettings(settings: UserSettings): void {
		if (settings.openUserSettingsKeybinding) {
			this.shortcut
				.add(
					settings.openUserSettingsKeybinding,
					OverlayCompRef,
					false,
					VisibleFlag.Game,
					VisibleFlag.Overlay
				)
				.subscribe(() => this.openUserSettings());
		}
		if (settings.exitAppKeybinding) {
			this.shortcut
				.add(
					settings.exitAppKeybinding,
					OverlayCompRef,
					false,
					VisibleFlag.Game,
					VisibleFlag.Overlay
				)
				.subscribe(() => this.app.quit(false));
		}
	}

	private getContext(settings: UserSettings): Context {
		return {
			language: settings.language || DEFAULT_USER_SETTINGS.language!,
			gameLanguage: settings.gameLanguage,
			leagueId: settings.leagueId,
		};
	}
}
