import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { Item } from '@shared/item/type';
import { ClientStringPipe } from '@shared/pipe';
import { SharedModule } from '@shared/shared.module';
import { Language } from '@shared/type';

@Component({
	selector: 'app-item-frame-state',
	templateUrl: './item-frame-state.component.html',
	styleUrls: ['./item-frame-state.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameQueryComponent,
		ClientStringPipe,
	],
})
export class ItemFrameStateComponent {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	@Input()
	public language!: Language;
}
