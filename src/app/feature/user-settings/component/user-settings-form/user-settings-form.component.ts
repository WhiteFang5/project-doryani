import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EnumValues } from '@core/class/values.class';
import { AppService, AppTranslateService, WindowService } from '@core/service';
import { PoEAccountService } from '@shared/poe-account/service/poe-account.service';
import { PoEAccount, PoECharacter } from '@shared/poe-account/type';
import { LeaguesService } from '@shared/service/leagues.service';
import { SharedModule } from '@shared/shared.module';
import { CacheExpirationType, Language, League, UiLanguage, UserSettings } from '@shared/type';
import { BehaviorSubject, Observable, Subscription, map } from 'rxjs';

interface UpdateInterval {
	name: string;
	value: number;
}

@Component({
	selector: 'app-user-settings-form',
	templateUrl: './user-settings-form.component.html',
	styleUrls: ['./user-settings-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule]
})
export class UserSettingsFormComponent implements OnInit, OnDestroy {
	public languages = new EnumValues(Language);
	public uiLanguages = new EnumValues(UiLanguage);
	public readonly updateIntervals: UpdateInterval[] = [
		{
			name: 'one-min',
			value: CacheExpirationType.OneMin
		},
		{
			name: 'two-min',
			value: CacheExpirationType.TwoMin
		},
		{
			name: 'three-min',
			value: CacheExpirationType.ThreeMin
		},
		{
			name: 'four-min',
			value: CacheExpirationType.FourMin
		},
		{
			name: 'five-min',
			value: CacheExpirationType.FiveMin
		},
		{
			name: 'ten-min',
			value: CacheExpirationType.TenMin
		},
		{
			name: 'fifteen-min',
			value: CacheExpirationType.FifteenMin
		},
		{
			name: 'half-hour',
			value: CacheExpirationType.HalfHour
		},
		{
			name: 'one-hour',
			value: CacheExpirationType.OneHour
		},
		{
			name: 'one-day',
			value: CacheExpirationType.OneDay
		},
		{
			name: 'never',
			value: CacheExpirationType.Never
		},
	];

	public leagues$ = new BehaviorSubject<League[]>([]);
	public autoLaunchEnabled$!: Observable<boolean>;
	public downloadAvailable$!: Observable<boolean>;

	public account$ = new BehaviorSubject<PoEAccount>({
		loggedIn: false,
	});
	public activeCharacter$ = new BehaviorSubject<PoECharacter>({
		name: 'N/A'
	});
	public characterLeagues$ = new BehaviorSubject<string[]>([]);

	public defaultCharacterUpdateInterval: UpdateInterval;

	@Input()
	public settings!: UserSettings;

	public displayWithOpacity = (value: number) => `${Math.round(value * 100)}%`;

	private accountSub?: Subscription;

	constructor(
		private readonly ref: ChangeDetectorRef,
		private readonly leagues: LeaguesService,
		private readonly app: AppService,
		private readonly translate: AppTranslateService,
		private readonly window: WindowService,
		private readonly accountService: PoEAccountService,
	) {
		this.defaultCharacterUpdateInterval = this.updateIntervals.find((x) => x.value === this.accountService.defaultCharacterCacheExpiration)!;
	}

	public ngOnInit(): void {
		if (this.settings.language) {
			this.updateAccount();
		}
		this.autoLaunchEnabled$ = this.app.isAutoLaunchEnabled();
	}

	public ngOnDestroy(): void {
		this.accountSub?.unsubscribe();
	}

	public onAutoLaunchChange(enabled: boolean): void {
		this.autoLaunchEnabled$ = this.app
			.updateAutoLaunchEnabled(enabled)
			.pipe(map((success) => (success ? enabled : !enabled)));
	}

	public onLanguageChange(): void {
		this.updateAccount();
	}

	public onForceRefreshLeaguesClick(): void {
		this.updateLeagues(true);
	}

	public onUiLanguageChange(): void {
		this.translate.use(this.settings.uiLanguage!);
	}

	public onZoomChange(): void {
		this.window.setZoom(this.settings.zoom! / 100);
	}

	public relaunchApp(): void {
		this.app.quit(true);
	}

	public exitApp(): void {
		this.app.quit(false);
	}

	public onLoginClick(): void {
		this.accountService.login(this.settings.language).subscribe((account) => {
			this.onAccountChanged(account, true);
			this.window.focus();
		});
	}

	public onLogoutClick(): void {
		this.accountService.logout(this.settings.language).subscribe((account) => this.onAccountChanged(account, true));
	}

	public onForceRefreshCharactersClick(): void {
		this.accountService.forceUpdateCharacters();
	}

	public getActiveCharacter(): PoECharacter {
		const activeCharacterName = this.settings.activeCharacterName;
		if (activeCharacterName) {
			return this.account$.value?.characters?.find((x) => x.name === activeCharacterName) || this.activeCharacter$.value;
		}
		return this.activeCharacter$.value;
	}

	public getCharacterInLeague(characters: PoECharacter[], leagueId: string): PoECharacter[] {
		return characters.filter((x) => x.leagueId === leagueId);
	}

	public getCharacterSelectLabel(character: PoECharacter): string {
		return `${character.name} (${this.translate.get('settings.abbr-level')}: ${character.level})`;
	}

	public getDefaultIntervalLabel(interval: UpdateInterval): string {
		return `${this.translate.get('settings.update-intervals.default')} (${this.translate.get(`settings.update-intervals.${interval.name}`)})`;
	}

	private updateLeagues(forceRefresh = false): void {
		this.leagues.getLeagues(this.settings.language, forceRefresh ? CacheExpirationType.FiveSeconds : CacheExpirationType.OneHour).subscribe((leagues) => this.onLeaguesChanged(leagues));
	}

	private updateAccount(): void {
		if (!this.accountSub) {
			this.accountSub = this.accountService.subscribe((account) => this.onAccountChanged(account));
		}
		this.accountService.getAsync(this.settings.language).subscribe((account) => this.onAccountChanged(account));
	}

	private onLeaguesChanged(leagues: League[]) {
		const selectedLeague = leagues.find((league) => league.id === this.settings.leagueId);
		if (!selectedLeague) {
			this.settings.leagueId = leagues[0].id;
		}
		this.leagues$.next(leagues);
	}

	private onAccountChanged(account: PoEAccount, forceRefreshLeagues = false): void {
		const current = this.account$.value;
		this.account$.next(account);
		if (current.name !== account.name) {
			if (forceRefreshLeagues) {
				this.leagues.getLeagues(this.settings.language, CacheExpirationType.Instant).subscribe((leagues) => this.onLeaguesChanged(leagues));
			} else {
				this.updateLeagues();
			}
		}
		if (account.characters) {
			const activeCharacter = account.characters.find(x => x.lastActive);
			if (activeCharacter) {
				this.activeCharacter$.next(activeCharacter);
			}
			this.characterLeagues$.next([...new Set(account.characters.map((x) => x.leagueId!))]);
		}
		this.ref.detectChanges();
	}
}
