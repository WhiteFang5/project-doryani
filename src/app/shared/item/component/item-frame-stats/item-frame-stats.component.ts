import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { ItemFrameSeparatorComponent } from '@shared/item/component/item-frame-separator/item-frame-separator.component';
import { ItemFrameValueGroupComponent } from '@shared/item/component/item-frame-value-group/item-frame-value-group.component';
import { ItemFrameValueComponent } from '@shared/item/component/item-frame-value/item-frame-value.component';
import { Item } from '@shared/item/type';
import { StatGroupPipe, StatTransformPipe } from '@shared/pipe';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';

@Component({
	selector: 'app-item-frame-stats',
	templateUrl: './item-frame-stats.component.html',
	styleUrls: ['./item-frame-stats.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameSeparatorComponent,
		ItemFrameQueryComponent,
		ItemFrameValueComponent,
		ItemFrameValueGroupComponent,
		StatGroupPipe,
		StatTransformPipe,
	],
})
export class ItemFrameStatsComponent {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Input()
	public language!: Language;

	@Input()
	public modifierMinRange!: number;

	@Input()
	public modifierMaxRange!: number;

	public getValueClass(id: string): string {
		if (!id || id.length === 0) {
			return '';
		}

		if (id.includes('fire_')) {
			return 'fire';
		}
		if (id.includes('cold_')) {
			return 'cold';
		}
		if (id.includes('lightning_')) {
			return 'lightning';
		}
		if (id.includes('chaos_')) {
			return 'chaos';
		}

		return '';
	}
}
