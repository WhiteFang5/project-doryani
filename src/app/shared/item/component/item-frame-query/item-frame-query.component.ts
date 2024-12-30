import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { ItemFrameComponent } from '@shared/item/component/item-frame/item-frame.component';
import { SharedModule } from '@shared/shared.module';

@Component({
	selector: 'app-item-frame-query',
	templateUrl: './item-frame-query.component.html',
	styleUrls: ['./item-frame-query.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class ItemFrameQueryComponent implements OnInit {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private _value: any;

	@Input()
	public disabled!: boolean;

	@Input()
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public property?: any;

	@Output()
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public propertyChange = new EventEmitter<any>();

	constructor(
		@Inject(ItemFrameComponent)
		private readonly itemFrame: ItemFrameComponent
	) { }

	public ngOnInit(): void {
		if (!this.itemFrame.queryItemChange.observed) {
			this.disabled = true;
		}
	}

	@Input()
	public set value(value: unknown) {
		this._value = value;
		if (this.property) {
			this.property = value;
			this.emitChange();
		}
	}

	public onQueryToggleClick(event: MouseEvent): void {
		const target = event.target as HTMLInputElement;
		if (target.type) {
			return;
		}

		if (this.property) {
			this.property = undefined;
		} else {
			this.property = this._value;
		}
		this.emitChange();
	}

	public checkChange(): void {
		if (this.property) {
			this.emitChange();
		}
	}

	private emitChange(): void {
		this.propertyChange.emit(this.property);
		this.itemFrame.onPropertyChange();
	}
}
