import { Injectable } from '@angular/core';
import { EvaluateDialogService } from '@feature/evaluate/service/evaluate-dialog.service';
import { EvaluateUserSettings } from '@feature/evaluate/type';
import { ItemProcessorService } from '@shared/item/processor/item-processor.service';
import { ItemClipboardService } from '@shared/item/service/item-clipboard.service';
import { ItemClipboardResultCode } from '@shared/item/type';
import { SnackBarService } from '@shared/material/service';
import { StashService } from '@shared/stash/service/stash.service';
import { Language } from '@shared/type';
import { Observable, catchError, mergeMap, of, tap, throwError } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class EvaluateService {
	constructor(
		private readonly item: ItemClipboardService,
		private readonly processor: ItemProcessorService,
		private readonly stash: StashService,
		private readonly snackbar: SnackBarService,
		private readonly evaluateDialog: EvaluateDialogService
	) { }

	public evaluate(settings: EvaluateUserSettings, language?: Language, gameLanguage?: Language): Observable<void> {
		return this.item.copy(settings.evaluateCopyAdvancedItemText).pipe(
			tap(({ item }) =>
				this.processor.process(item, {
					normalizeQuality: settings.evaluateQueryNormalizeQuality,
				})
			),
			mergeMap(({ code, point, item }) => {
				switch (code) {
					case ItemClipboardResultCode.Success:
						return this.evaluateDialog.open(point!, item!, settings, language, gameLanguage).pipe(
							mergeMap((result) => {
								if (!result) {
									return of();
								}

								this.stash.copyPrice(result);
								return this.snackbar.info('evaluate.tag.clipboard');
							})
						);
					case ItemClipboardResultCode.Empty:
						return this.snackbar.warning('clipboard.empty');
					case ItemClipboardResultCode.ParserError:
						return this.snackbar.warning('clipboard.parser-error');
					default:
						return throwError(() => `code: '${code}' out of range`);
				}
			}),
			catchError((err) => {
				console.error(err);
				return this.snackbar.error('clipboard.error');
			})
		);
	}
}
