import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    EventEmitter,
    Input,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { MatInput } from '@angular/material/input';
import { MatListOption } from '@angular/material/list';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface SelectListItem {
	key: string;
	text: string;
	selected: boolean;
}

@Component({
	selector: 'app-select-list',
	templateUrl: './select-list.component.html',
	styleUrls: ['./select-list.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class SelectListComponent implements OnInit {
	private items$ = new BehaviorSubject<SelectListItem[]>([]);
	private _items!: SelectListItem[];

	@Input()
	public set items(items: SelectListItem[]) {
		this._items = items;
		this.filterItems();
	}

	@Input()
	public itemFilter!: (item: SelectListItem, filterValue: string) => boolean;

	@Output()
	public itemsChange = new EventEmitter<SelectListItem[]>();

	@ContentChild(TemplateRef, { static: true })
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public itemTemplate!: TemplateRef<any>;

	@ViewChild(MatInput, { static: true })
	public filter!: MatInput;

	public selected$!: Observable<SelectListItem[]>;
	public deselected$!: Observable<SelectListItem[]>;

	public trackByKey = (_: number, item: SelectListItem) => item.key;

	public ngOnInit(): void {
		this.selected$ = this.items$.pipe(map((x) => x.filter((y) => !!y.selected)));
		this.deselected$ = this.items$.pipe(map((x) => x.filter((y) => !y.selected)));
		this.filterItems();
	}

	public onFilterKeyUp(): void {
		this.filterItems();
	}

	public selectOptions(options: MatListOption[]): void {
		if (options.length > 0) {
			options.forEach((option) => (option.value.selected = true));
			this.updateItems();
		}
	}

	public deselectOptions(options: MatListOption[]): void {
		if (options.length > 0) {
			options.forEach((option) => (option.value.selected = false));
			this.updateItems();
		}
	}

	public selectItem(item: SelectListItem): void {
		item.selected = true;
		this.updateItems();
	}

	public deselectItem(item: SelectListItem): void {
		item.selected = false;
		this.updateItems();
	}

	private filterItems(): void {
		const filterValue = (this.filter.value || '').toLowerCase();

		if (this.itemFilter) {
			this.items$.next(
				this._items.filter((item) => this.itemFilter(item, filterValue))
			);
		} else {
			this.items$.next(
				this._items.filter((item) => {
					const itemValue = item.text.toLowerCase();
					return itemValue.indexOf(filterValue) !== -1;
				})
			);
		}
	}

	private updateItems(): void {
		this.filterItems();
		this.itemsChange.next(this._items);
	}
}
