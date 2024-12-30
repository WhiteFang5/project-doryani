import { Injectable } from '@angular/core';
import { ClipboardService, KeyboardService, MouseService } from '@core/service/input';
import { ItemParserService } from '@shared/item/parser/item-parser.service';
import { ItemClipboardResult, ItemClipboardResultCode } from '@shared/item/type';
import { GameService } from '@shared/service';
import { KeyCode } from '@shared/type';
import { Observable, catchError, concatMap, delay, iif, map, mergeMap, of, retry, tap, throwError } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ItemClipboardService {
	constructor(
		private readonly mouse: MouseService,
		private readonly keyboard: KeyboardService,
		private readonly game: GameService,
		private readonly clipboard: ClipboardService,
		private readonly itemParser: ItemParserService
	) { }

	public copy(copyAdvancedText: boolean, sections?: Record<number, boolean>): Observable<ItemClipboardResult> {
		return of(null).pipe(
			map(() => this.mouse.position()),
			tap(() => {
				this.keyboard.setKeyboardDelay(1);
				this.keyboard.keyToggle(KeyCode.Alt, false);
				this.keyboard.keyToggle(KeyCode.AltRight, false);
			}),
			tap(() => this.game.focus()),
			mergeMap((point) => {
				return of(null).pipe(
					mergeMap(() => {
						const oldText = this.clipboard.readText();

						this.keyboard.setKeyboardDelay(25);
						this.keyboard.keyTap(KeyCode.C, copyAdvancedText ? [KeyCode.Ctrl, KeyCode.Alt] : [KeyCode.Ctrl]);

						const text = this.clipboard.readText() || '';
						if (text.length <= 0) {
							return throwError(() => 'empty');
						}

						return of({ oldText, text });
					}),
					retry({
						delay: (errors) =>
							errors.pipe(
								concatMap((error, retry) =>
									iif(() => retry >= 8, throwError(() => error), of(error).pipe(delay(25)))
								)
							)
					}),
					catchError((texts) => of({ oldText: texts.oldText, text: '' })),
					tap((texts) => this.clipboard.writeText(texts.oldText)),
					map((texts) => {
						const { text } = texts;
						if (text.length <= 0) {
							return { code: ItemClipboardResultCode.Empty };
						}

						const item = this.itemParser.parse(text, sections);
						if (!item) {
							return { code: ItemClipboardResultCode.ParserError };
						}

						const result: ItemClipboardResult = {
							code: ItemClipboardResultCode.Success,
							item,
							point,
						};
						return result;
					})
				);
			})
		);
	}
}
