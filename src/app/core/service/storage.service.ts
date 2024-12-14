import { Injectable } from '@angular/core';
import { LocalForageProvider } from '@core/provider';
import { Observable, forkJoin, from, map, mergeMap, of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class StorageService {
	private readonly db: LocalForage;

	constructor(localForage: LocalForageProvider) {
		this.db = localForage.provide();
	}

	public getOrDefault<TData>(key: string, defaultValue: () => TData): Observable<TData> {
		return from(this.db.getItem<TData>(key)).pipe(
			mergeMap((settings) => (settings ? of(settings) : this.save(key, defaultValue!())))
		);
	}

	public get<TData>(key: string): Observable<TData | null> {
		return from(this.db.getItem<TData>(key));
	}

	public save<TData>(key: string, value: TData): Observable<TData> {
		return from(this.db.setItem<TData>(key, value));
	}

	public keys(): Observable<string[]> {
		return from(this.db.keys());
	}

	public delete<TValue>(predicate: (key: string, value: TValue) => boolean): Observable<null> {
		const toDelete: string[] = [];
		return from(
			this.db.iterate((value: TValue, key) => {
				if (predicate(key, value)) {
					toDelete.push(key);
				}
			})
		).pipe(
			mergeMap(() => {
				const tasks = toDelete.map((key) => from(this.db.removeItem(key)));
				if (tasks.length > 0) {
					return forkJoin(tasks).pipe(map(() => null));
				}
				return of(null);
			})
		);
	}
}
