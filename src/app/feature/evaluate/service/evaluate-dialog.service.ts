import { Injectable } from '@angular/core';
import { DialogService } from '@core/service/dialog';
import { EvaluateDialogComponent } from '@feature/evaluate/component/evaluate-dialog/evaluate-dialog.component';
import { EvaluateDialogData, EvaluateResult, EvaluateResultView, EvaluateUserSettings } from '@feature/evaluate/type';
import { Item } from '@shared/item/type';
import { StatsService } from '@shared/stats/service';
import { StatType } from '@shared/stats/type';
import { DialogSpawnPosition, Language, Point } from '@shared/type';
import { Observable } from 'rxjs';

const DIALOG_MIN_WIDTH = 400;
const DIALOG_LINE_HEIGHT = 19;
const DIALOG_DIVIDER_HEIGHT = 8;
const DIALOG_AVG_CHAR_WIDTH = 7.6;
const DIALOG_AVG_VALUE_WIDTH = 36;

@Injectable({
	providedIn: 'root',
})
export class EvaluateDialogService {
	constructor(
		private readonly dialog: DialogService,
		private readonly stats: StatsService
	) { }

	public open(
		point: Point,
		item: Item,
		settings: EvaluateUserSettings,
		language?: Language,
		gameLanguage?: Language
	): Observable<EvaluateResult> {
		const { width, height } = this.estimateBounds(item, settings, gameLanguage);

		const data: EvaluateDialogData = {
			item,
			settings,
			language,
			gameLanguage,
		};

		const position = settings.dialogSpawnPosition === DialogSpawnPosition.Cursor ? point : undefined;
		return this.dialog.open(
			EvaluateDialogComponent,
			data,
			{
				position,
				width,
				height,
			},
			settings.focusable!
		);
	}

	private estimateBounds(
		item: Item,
		settings: EvaluateUserSettings,
		language: Language | undefined
	): { width: number; height: number; } {
		let width = 4; // padding
		let height = 4; // padding

		if (item.nameId) {
			height += 20;
		}
		if (item.typeId) {
			height += 33;
		}

		if (item.damage || item.properties) {
			if (item.damage) {
				if (item.damage.dps) {
					height += DIALOG_LINE_HEIGHT;
				}
				if (item.damage.edps) {
					height += DIALOG_LINE_HEIGHT;
				}
				if (item.damage.edps) {
					height += DIALOG_LINE_HEIGHT;
				}
			}
			if (item.properties) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const anyProperties = item.properties as any;
				Object.getOwnPropertyNames(item.properties).forEach((key) => {
					if (anyProperties[key]) {
						switch (key) {
							default:
								height += DIALOG_LINE_HEIGHT;
								break;
						}
					}
				});
			}
			height += DIALOG_DIVIDER_HEIGHT;
		}

		if (item.level || item.requirements) {
			if (item.level) {
				height += DIALOG_LINE_HEIGHT;
			}
			if (item.requirements) {
				height += DIALOG_LINE_HEIGHT;
			}
			height += DIALOG_DIVIDER_HEIGHT;
		}

		if (item.sockets) {
			const length = item.sockets.length;
			const socketHeight = Math.floor((length + 1) / 2) * 34;
			const linkHeight = length >= 3 ? Math.floor((length - 1) / 2) * 22 : 0;
			height += socketHeight + linkHeight;
			height += DIALOG_DIVIDER_HEIGHT;
		}

		if (item.stats) {
			height += item.stats.reduce((a) => a + DIALOG_LINE_HEIGHT, 0);

			item.stats.forEach((stat) => {
				const parts = this.stats.transform(stat, language);
				const count = parts.reduce((a, b) => a + b.length, 0);
				const size = count * DIALOG_AVG_CHAR_WIDTH + stat.values.length * DIALOG_AVG_VALUE_WIDTH;
				if (size >= width) {
					width = size;
				}
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const unique: any = {};
			item.stats.forEach((stat) => (unique[stat.type] = true));
			if (unique[StatType.Enchant]) {
				height += DIALOG_DIVIDER_HEIGHT;
			}
			if (
				unique[StatType.Implicit]) {
				height += DIALOG_DIVIDER_HEIGHT;
			}
			if (
				unique[StatType.Explicit] ||
				unique[StatType.Sanctum]
			) {
				height += DIALOG_DIVIDER_HEIGHT;
			}
		}

		if (item.corrupted || item.mirrored || item.unmodifiable || item.relic) {
			if (item.corrupted || item.unmodifiable) {
				height += DIALOG_LINE_HEIGHT;
			}
			if (item.mirrored) {
				height += DIALOG_LINE_HEIGHT;
			}
			if (item.relic) {
				height += DIALOG_LINE_HEIGHT;
			}
			height += DIALOG_DIVIDER_HEIGHT;
		}

		// price / graph
		height += DIALOG_DIVIDER_HEIGHT;

		const value = 45;
		height += value;
		height += DIALOG_DIVIDER_HEIGHT;

		const price = 64;
		height += price;

		const toggles = 35;
		height += toggles;

		if (settings.evaluateResultView === EvaluateResultView.Graph) {
			const graph = 200;
			height += graph;
		} else {
			const list = 424;
			height += list;
		}

		return {
			width: Math.max(width, DIALOG_MIN_WIDTH),
			height,
		};
	}
}
