import { Injectable } from '@angular/core';
import { BrowserService } from '@core/service';
import { BookmarkUserBookmark } from '@feature/bookmark/type/bookmark.type';
import { Subject, tap, throttleTime } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class BookmarkService {
	private readonly bookmark$ = new Subject<BookmarkUserBookmark>();

	constructor(private readonly browser: BrowserService) {
		this.init();
	}

	public open(bookmark: BookmarkUserBookmark): void {
		this.bookmark$.next(bookmark);
	}

	private init(): void {
		this.bookmark$
			.pipe(
				throttleTime(350),
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				tap((bookmark) => {
					//TODO
					//this.browser.open(bookmark.url, !!bookmark.external);
				})
			)
			.subscribe();
	}
}
