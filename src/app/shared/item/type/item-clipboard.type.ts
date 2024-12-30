import { Item } from '@shared/item/type';
import { Point } from '@shared/type';

export enum ItemClipboardResultCode {
	Success,
	Empty,
	ParserError,
}

export interface ItemClipboardResult {
	code: ItemClipboardResultCode;
	item?: Item;
	point?: Point;
}
