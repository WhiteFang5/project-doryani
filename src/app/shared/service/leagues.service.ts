import { Injectable } from '@angular/core';
import { LeaguesProvider } from '@shared/provider';
import { ContextService } from '@shared/service';
import { CacheExpirationType, Language, League } from '@shared/type';
import { Observable, map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LeaguesService {
	constructor(
		private readonly context: ContextService,
		private readonly leaguesProvider: LeaguesProvider
	) { }

	public getLeagues(language?: Language, cacheExpiration: CacheExpirationType = CacheExpirationType.OneHour): Observable<League[]> {
		language = language || this.context.get().language;
		return this.leaguesProvider.provide(language, cacheExpiration);
	}

	public get(leagueId: string, language?: Language): Observable<League | undefined> {
		language = language || this.context.get().language;
		return this.getLeagues(language).pipe(map((leagues) => leagues.find((l) => l.id === leagueId)));
	}
}
