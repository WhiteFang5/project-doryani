import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { ItemFrameValueGroupComponent } from '@shared/item/component/item-frame-value-group/item-frame-value-group.component';
import { ItemFrameValueComponent } from '@shared/item/component/item-frame-value/item-frame-value.component';
import { Item, ItemCategory, ItemProperties } from '@shared/item/type';
import { ClientStringPipe } from '@shared/pipe';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';

@Component({
	selector: 'app-item-frame-properties',
	templateUrl: './item-frame-properties.component.html',
	styleUrls: ['./item-frame-properties.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameQueryComponent,
		ItemFrameValueGroupComponent,
		ItemFrameValueComponent,
		ClientStringPipe,
	],
})
export class ItemFramePropertiesComponent implements OnInit {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Input()
	public language!: Language;

	@Input()
	public properties!: (keyof ItemProperties)[];

	@Input()
	public minRange!: number;

	@Input()
	public maxRange!: number;

	public isWeapon!: boolean;
	public isArmour!: boolean;

	public ngOnInit(): void {
		this.properties = this.properties || [
			'weaponCriticalStrikeChance',
			'weaponAttacksPerSecond',
			'weaponRange',
			'shieldBlockChance',
			'armourArmour',
			'armourEvasionRating',
			'armourEnergyShield',
			'armourSpirit',
			'stackSize',
			'gemLevel',
			'mapTier',
			'mapBonus',
			'quality',
			'gemQualityType',
		];
		this.isArmour = this.item.category?.startsWith(ItemCategory.Armour) || false;
		this.isWeapon = this.item.category?.startsWith(ItemCategory.Weapon) || false;
	}
}
