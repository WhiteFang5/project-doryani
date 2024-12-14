import { Injectable } from '@angular/core';
import { LeaguesProvider } from '@shared/provider';
import { Context } from '@shared/type';
import { Observable, map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ContextFactory {
	constructor(
		private readonly leaguesProvider: LeaguesProvider
	) {
	}

	public create(context: Context): Observable<Context> {
		return this.leaguesProvider.provide(context.language).pipe(
			map((leagues) => {
				const result: Context = {
					...context,
				};
				const selectedLeague = leagues.find((league) => league.id === result.leagueId);
				if (!selectedLeague) {
					result.leagueId = leagues[0].id;
				}
				return result;
			})
		);
	}
}
