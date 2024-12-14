import { Injectable } from '@angular/core';
import { BrowserService, ElectronService } from '@core/service';
import { PoEAccountProvider, PoECharacterProvider } from '@shared/poe-account/provider';
import { PoEAccount, PoECharacter } from '@shared/poe-account/type';
import { PoEHttpService } from '@shared/poe-api';
import { ContextService } from '@shared/service';
import { CacheExpirationType, Language, UserSettings } from '@shared/type';
import { BehaviorSubject, Observable, Subscription, map, mergeMap, of, tap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class PoEAccountService {
	private readonly accountSubject = new BehaviorSubject<PoEAccount>({ loggedIn: false });

	public get defaultCharacterCacheExpiration(): CacheExpirationType {
		return this.characterProvider.defaultCacheExpiration;
	}

	private settings?: UserSettings;

	constructor(
		private readonly electronService: ElectronService,
		private readonly context: ContextService,
		private readonly accountProvider: PoEAccountProvider,
		private readonly browser: BrowserService,
		private readonly poeHttpService: PoEHttpService,
		private readonly characterProvider: PoECharacterProvider,
	) { }

	public register(settings: UserSettings): Observable<PoEAccount> {
		this.settings = settings;

		return this.getAsync();
	}

	public unregister(): void {
		this.settings = undefined;
	}

	public subscribe(next: (value: PoEAccount) => void): Subscription {
		return this.accountSubject.subscribe(next);
	}

	public get(): PoEAccount {
		return this.accountSubject.getValue();
	}

	public getActiveCharacter(): PoECharacter | undefined {
		return this.get().characters?.find(x => x.lastActive);
	}

	public getAsync(language?: Language): Observable<PoEAccount> {
		language = language || this.context.get().language;
		const oldAccount = { ...this.get() };
		return this.accountProvider.provide(language).pipe(mergeMap((account) => {
			return this.getCharacters(account, language).pipe(map(() => {
				if (oldAccount !== account) {
					this.accountSubject.next(account);
				}
				return account;
			}));
		}));
	}

	public forceUpdateCharacters(): void {
		this.updateCharacters(CacheExpirationType.FiveSeconds);
	}

	public login(language?: Language): Observable<PoEAccount> {
		language = language || this.context.get().language;
		return this.browser.openAndWait(this.poeHttpService.getLoginUrl(language)).pipe(mergeMap(() => {
			return this.accountProvider.provide(language!, CacheExpirationType.Instant).pipe(mergeMap((account) => {
				if (account.loggedIn) {
					return this.characterProvider.provide(account.name!, language!, CacheExpirationType.Instant).pipe(map((characters) => {
						account.characters = characters;
						this.accountSubject.next(account);
						return account;
					}));
				} else {
					return of(account);
				}
			}));
		}));
	}

	public logout(language?: Language): Observable<PoEAccount> {
		language = language || this.context.get().language;
		return this.browser.retrieve(this.poeHttpService.getLogoutUrl(language)).pipe(
			mergeMap(() =>
				this.accountProvider.update({
					loggedIn: false,
				}, language!)
			),
			tap((account) => {
				this.accountSubject.next(account);
			})
		);
	}

	private getCharacters(account: PoEAccount, language?: Language, cacheExpiration?: CacheExpirationType): Observable<PoECharacter[]> {
		if (account.loggedIn) {
			language = language || this.context.get().language;
			return this.characterProvider.provide(account.name!, language, cacheExpiration).pipe(tap((characters) => {
				account.characters = characters;
			}));
		}
		return of([]);
	}

	private updateCharacters(cacheExpiration?: CacheExpirationType) {
		const account = this.get();
		if (account.loggedIn) {
			const oldAccount = { ...account };
			this.getCharacters(account, undefined, cacheExpiration || this.settings?.charactersCacheExpiration).subscribe(() => {
				if (oldAccount !== account) {
					this.accountSubject.next(account);
				}
			});
		}
	}
}
