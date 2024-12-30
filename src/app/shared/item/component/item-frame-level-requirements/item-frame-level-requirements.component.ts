import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { ItemFrameValueGroupComponent } from '@shared/item/component/item-frame-value-group/item-frame-value-group.component';
import { ItemFrameValueComponent } from '@shared/item/component/item-frame-value/item-frame-value.component';
import { Item } from '@shared/item/type';
import { ClientStringPipe } from '@shared/pipe';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';

@Component({
	selector: 'app-item-frame-level-requirements',
	templateUrl: './item-frame-level-requirements.component.html',
	styleUrls: ['./item-frame-level-requirements.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameQueryComponent,
		ItemFrameValueGroupComponent,
		ItemFrameValueComponent,
		ClientStringPipe,
	],
})
export class ItemFrameLevelRequirementsComponent {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Input()
	public language!: Language;
}
