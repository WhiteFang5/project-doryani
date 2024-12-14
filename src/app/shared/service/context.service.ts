import { Injectable } from '@angular/core';
import { ContextFactory } from '@shared/factory';
import { Context, Language } from '@shared/type';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ContextService {
	private readonly contextSubject = new BehaviorSubject<Context>({ language: Language.English });

	constructor(
		private readonly contextFactory: ContextFactory
	) {
	}

	public init(defaultContext: Context): Observable<Context> {
		return this.contextFactory
			.create(defaultContext)
			.pipe(tap((createdContext) => this.contextSubject.next(createdContext)));
	}

	public get(): Context {
		// return copy
		return { ...this.contextSubject.getValue() };
	}

	public update(context: Context): void {
		this.contextSubject.next(context);
	}
}
