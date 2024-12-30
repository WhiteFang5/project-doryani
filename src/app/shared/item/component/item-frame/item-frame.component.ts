import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ItemFrameHeaderComponent } from '@shared/item/component/item-frame-header/item-frame-header.component';
import { ItemFrameLevelRequirementsComponent } from '@shared/item/component/item-frame-level-requirements/item-frame-level-requirements.component';
import { ItemFramePropertiesComponent } from '@shared/item/component/item-frame-properties/item-frame-properties.component';
import { ItemFrameSeparatorComponent } from '@shared/item/component/item-frame-separator/item-frame-separator.component';
import { ItemFrameSocketsComponent } from '@shared/item/component/item-frame-sockets/item-frame-sockets.component';
import { ItemFrameStateComponent } from '@shared/item/component/item-frame-state/item-frame-state.component';
import { ItemFrameStatsComponent } from '@shared/item/component/item-frame-stats/item-frame-stats.component';
import { Item, ItemProperties, ItemRarity } from '@shared/item/type';
import { ContextService } from '@shared/service';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';
import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'app-item-frame',
	templateUrl: './item-frame.component.html',
	styleUrls: ['./item-frame.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameHeaderComponent,
		ItemFramePropertiesComponent,
		ItemFrameSeparatorComponent,
		ItemFrameLevelRequirementsComponent,
		ItemFrameSocketsComponent,
		ItemFrameStatsComponent,
		ItemFrameStateComponent,
	],
})
export class ItemFrameComponent implements OnInit {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Output()
	public queryItemChange = new EventEmitter<Item>();

	@Input()
	public language?: Language;

	@Input()
	public separator = false;

	@Input()
	public propertyMinRange = 0.1;

	@Input()
	public propertyMaxRange = 0.5;

	@Input()
	public modifierMinRange = 0.1;

	@Input()
	public modifierMaxRange = 0.5;

	@Input()
	public opacity = 0.8;

	@Input()
	public properties?: (keyof ItemProperties)[];

	@Input()
	public filterOptionsOpen = false;

	public req!: boolean;
	public sockets!: boolean;
	public stats!: boolean;
	public state!: boolean;

	public text$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly context: ContextService) { }

	public ngOnInit(): void {
		this.language = this.language || this.context.get().gameLanguage || this.context.get().language;
		this.queryItem = this.queryItem || {
			influences: {},
			damage: {},
			stats: [],
			properties: {},
			requirements: {},
			sockets: new Array((this.item.sockets || []).length).fill({}),
		};
		this.req = !!(this.item.level || this.item.requirements);
		this.sockets = !!(this.item.sockets && this.item.sockets.length > 0);
		this.stats = !!(this.item.stats && this.item.stats.length > 0);
		this.state = !!(
			this.item.corrupted !== undefined ||
			this.item.mirrored !== undefined ||
			this.item.unmodifiable !== undefined ||
			this.item.unidentified !== undefined ||
			this.item.relic !== undefined
		);

		if (!this.queryItemChange.observed) {
			this.text$.next(true);
		}
	}

	public onMouseDown(event: MouseEvent): void {
		if (this.queryItemChange.observed && event.button === 2) {
			this.text$.next(true);
		}
	}

	public onMouseUp(event: MouseEvent): void {
		if (this.queryItemChange.observed && event.button === 2) {
			this.text$.next(false);
		}
	}

	public onPropertyChange(): void {
		this.queryItemChange.emit(this.queryItem);
	}

	public isQueryable(item: Item): boolean {
		switch (item.rarity) {
			case ItemRarity.Normal:
			case ItemRarity.Magic:
			case ItemRarity.Rare:
				return true;
		}
		return false;
	}
}
