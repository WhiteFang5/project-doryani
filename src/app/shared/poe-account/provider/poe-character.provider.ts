import { Injectable } from '@angular/core';
import { CacheService } from '@core/service';
import { PoECharacter } from '@shared/poe-account/type';
import { ApiCharacterResponse, ApiErrorResponse, PoEHttpService } from '@shared/poe-api';
import { CacheExpiration, CacheExpirationType, Language } from '@shared/type';
import { Observable, map } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class PoECharacterProvider {
	public readonly defaultCacheExpiration = CacheExpirationType.FiveMin;

	constructor(
		private readonly poeHttpService: PoEHttpService,
		private readonly cache: CacheService
	) { }

	public provide(accountName: string, language: Language, cacheExpiration?: CacheExpirationType): Observable<PoECharacter[]> {
		const key = `characters_${language}_${accountName}`;
		return this.cache.proxy(key, () => this.fetch(accountName, language), CacheExpiration.getExpiration(cacheExpiration, this.defaultCacheExpiration));
	}

	private fetch(accountName: string, language: Language): Observable<PoECharacter[]> {
		return this.poeHttpService.getCharacters(accountName, language).pipe(map((response) => {
			const apiError = response as ApiErrorResponse;
			if (apiError && apiError.error) {
				return [];
			} else {
				const characters = response as ApiCharacterResponse[];
				return characters.filter(x => x.name).map((character) => {
					const poeCharacter: PoECharacter = {
						name: character.name!,
						leagueId: character.league,
						level: character.level,
						experience: character.experience,
						lastActive: character.lastActive,
					};
					return poeCharacter;
				});
			}
		}));
	}
}
