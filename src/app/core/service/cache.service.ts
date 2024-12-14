import { Injectable } from '@angular/core';
import { ofType } from '@core/function';
import { LoggerService, StorageService } from '@core/service';
import { Observable, catchError, map, mergeMap, of, shareReplay, tap, throwError } from 'rxjs';

interface CacheEntry<TValue> {
	value: TValue;
	creation: number;
	expiry: number;
	expired: number;
}

const LogTag = 'cacheService';

@Injectable({
	providedIn: 'root',
})
export class CacheService {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private readonly cache: Record<string, Observable<any> | undefined> = {};

	constructor(
		private readonly storage: StorageService,
		private readonly logger: LoggerService
	) { }

	public proxy<TValue>(
		key: string,
		valueFn: () => Observable<TValue>,
		expiry: number,
		slidingExpiry = false,
	): Observable<TValue> {
		return this.storage.get<CacheEntry<TValue>>(key).pipe(
			mergeMap((entry) => {
				let now = Date.now();
				if (entry) {
					this.logger.debug(LogTag, `'${key}' Cache check: now=${new Date(now).toISOString()}; entry.expiry=${entry.expiry}; expiry=${expiry}; expired=${new Date(entry.expired).toISOString()}; creation=${new Date(entry.creation).toISOString()}; newExpiry = ${new Date(entry.creation + expiry).toISOString()}`);
				} else {
					this.logger.debug(LogTag, `'${key}' Cache check: now=${new Date(now).toISOString()}; no entry found`);
				}
				if (
					entry &&
					ofType<TValue>(entry.value) &&
					((entry.expiry === expiry && entry.expired > now) ||
						(entry.expiry !== expiry && entry.creation + expiry > now))
				) {
					this.logger.debug(LogTag, `'${key}' Cache Hit`);
					if (slidingExpiry) {
						this.storage.save(key, {
							value: entry.value,
							creation: now,
							expiry,
							expired: now + expiry,
						});
					}
					return of(entry.value);
				}
				let cachedValue = this.cache[key];
				if (cachedValue !== undefined) {
					return cachedValue;
				} else {
					this.logger.debug(LogTag, `'${key}' Cache miss -> retrieving value`);
					this.cache[key] = cachedValue = valueFn().pipe(
						catchError((error) => {
							if (entry) {
								this.logger.info(
									`Could not update value for key: '${key}'. Using cached value from: '${new Date(entry.expired).toISOString()}'.`,
									error
								);
								return of(entry.value);
							}
							return throwError(() => error);
						}),
						tap((value) => {
							this.cache[key] = undefined;
							// Update the 'now' value since the 'valueFn' might be async and take a long time to complete
							now = Date.now();
							this.storage.save(key, {
								value,
								creation: now,
								expiry,
								expired: now + expiry,
							});
						}),
						shareReplay(1)
					);
					return cachedValue;
				}
			})
		);
	}

	public store<TValue>(
		key: string,
		value: TValue,
		expiry: number,
		waitForResult = true
	): Observable<TValue> {
		const now = Date.now();
		const result = this.storage.save(key, {
			value,
			creation: now,
			expiry,
			expired: now + expiry,
		});
		if (waitForResult) {
			return result.pipe(map(() => value));
		}
		return of(value);
	}

	public retrieve<TValue>(key: string): Observable<TValue | undefined> {
		return this.storage.get<CacheEntry<TValue>>(key).pipe(map((entry) => entry?.value));
	}

	public prune(path: string): Observable<null> {
		const now = Date.now();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return this.storage.delete<CacheEntry<any>>((key: string, value: CacheEntry<any>) => {
			return key.startsWith(path) && value && value.expired <= now;
		});
	}

	public keys(): Observable<string[]> {
		return this.storage.keys();
	}
}
