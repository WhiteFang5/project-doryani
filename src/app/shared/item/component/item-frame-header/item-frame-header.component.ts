import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { Item, ItemGemQualityType, ItemRarity } from '@shared/item/type';
import { BaseItemTypePipe } from '@shared/pipe';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';

@Component({
	selector: 'app-item-frame-header',
	templateUrl: './item-frame-header.component.html',
	styleUrls: ['./item-frame-header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameQueryComponent,
		BaseItemTypePipe,
	],
})
export class ItemFrameHeaderComponent {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Input()
	public queryable!: boolean;

	@Input()
	public language!: Language;

	public getHeaderClass(item: Item): string {
		const headerClasses: string[] = ['header'];

		if (item.name && item.typeId) {
			headerClasses.push('double');
		}

		if (item.rarity) {
			switch (item.rarity) {
				case ItemRarity.Quest:
					headerClasses.push(ItemRarity.Normal);
					break;
				default:
					headerClasses.push(item.rarity);
					break;
			}
		}

		return headerClasses.join(' ');
	}

	public getNameLabelType(item: Item): number {
		if (
			item.rarity === ItemRarity.Gem &&
			item.properties?.gemQualityType !== ItemGemQualityType.Default
		) {
			return 3;
		}
		return 0;
	}
}
