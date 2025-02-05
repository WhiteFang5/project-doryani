import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { ItemFrameQueryComponent } from '@shared/item/component/item-frame-query/item-frame-query.component';
import { ItemFrameValueInputComponent } from '@shared/item/component/item-frame-value-input/item-frame-value-input.component';
import { ItemFrameComponent } from '@shared/item/component/item-frame/item-frame.component';
import { ItemParserUtils } from '@shared/item/parser/item-parser.utils';
import { ItemValue } from '@shared/item/type';
import { SharedModule } from '@shared/shared.module';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
	selector: 'app-item-frame-value',
	templateUrl: './item-frame-value.component.html',
	styleUrls: ['./item-frame-value.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		SharedModule,
		ItemFrameValueInputComponent,
	],
})
export class ItemFrameValueComponent implements OnInit {
	public default!: ItemValue;
	public parsed!: number;

	@Input()
	public disabled!: boolean;

	@Input()
	public minRange!: number;

	@Input()
	public maxRange!: number;

	@Input()
	public value!: ItemValue;

	@Output()
	public valueChange = new EventEmitter<ItemValue>();

	public focused$ = new BehaviorSubject<boolean>(false);
	public text$: Subject<boolean>;

	constructor(
		@Inject(ItemFrameComponent)
		itemFrame: ItemFrameComponent,
		@Inject(ItemFrameQueryComponent)
		private readonly query: ItemFrameQueryComponent
	) {
		this.text$ = itemFrame.text$;
	}

	public ngOnInit(): void {
		this.init();
	}

	public onMouseDown(event: MouseEvent): void {
		event.stopImmediatePropagation();
	}

	public onMouseUp(event: MouseEvent, min: boolean, max: boolean): void {
		event.stopImmediatePropagation();
		if (event.button === 1) {
			this.resetValue(min, max);
		} else if (event.button === 2) {
			this.toggleValue(min, max);
		}
	}

	public onWheel(event: WheelEvent, min: boolean, max: boolean): void {
		event.stopImmediatePropagation();
		this.adjustValue(this.getStepFromEvent(event), min, max);
	}

	public onValueChange(newMin: number | undefined, newMax: number | undefined): void {
		const { min, max } = this.value;

		this.value.min = newMin;
		this.value.max = newMax;

		this.clampValue();

		if (min !== this.value.min || max !== this.value.max) {
			this.emitChange();
		}
	}

	public onFocusChange(focus: boolean): void {
		this.focused$.next(focus);
	}

	public resetValue(isMin: boolean, isMax: boolean): void {
		if (this.disabled) {
			return;
		}

		const { min, max } = this.value;
		if (isMin) {
			this.value.min = this.default.min;
		}
		if (isMax) {
			this.value.max = this.default.max;
		}
		if (min !== this.value.min || max !== this.value.max) {
			this.emitChange();
		}
	}

	public toggleValue(isMin: boolean, isMax: boolean): void {
		if (this.disabled) {
			return;
		}

		const { min, max } = this.value;

		if (isMin && isMax) {
			if (this.value.min === undefined || this.value.max === undefined) {
				this.value = {
					...this.default,
				};
			} else {
				this.value.min = this.value.max = undefined;
			}
		} else {
			if (isMin) {
				this.value.min = this.value.min === undefined ? this.default.min : undefined;
			}
			if (isMax) {
				this.value.max = this.value.max === undefined ? this.default.max : undefined;
			}
		}

		if (min !== this.value.min || max !== this.value.max) {
			this.emitChange();
		}
	}

	public adjustValue(step: number, isMin: boolean, isMax: boolean): void {
		if (this.disabled) {
			return;
		}

		const { min, max } = this.value;

		if (isMin) {
			if (this.value.min === undefined) {
				this.value.min = this.default.min;
			} else {
				this.value.min -= step;
			}
		}

		if (isMin && isMax) {
			step *= -1;
		}

		if (isMax) {
			if (this.value.max === undefined) {
				this.value.max = this.default.min;
			} else {
				this.value.max -= step;
			}
		}

		this.clampValue();

		if (min !== this.value.min || max !== this.value.max) {
			this.emitChange();
		}
	}

	public getStepFromEvent(event: WheelEvent): number {
		let step = 1;
		if (event.altKey && event.shiftKey) {
			const value = this.value.value;
			if (value) {
				if (value >= 100000000) {
					step *= 1000000;
				} else if (value >= 10000000) {
					step *= 100000;
				} else if (value >= 1000000) {
					step *= 10000;
				} else if (value >= 100000) {
					step *= 1000;
				} else if (value >= 10000) {
					step *= 100;
				} else if (value >= 1000) {
					step *= 10;
				}
			}
		} else if (event.altKey) {
			step = 0.1;
		} else if (event.shiftKey) {
			step = 5;
		}

		if (event.deltaY < 0) {
			step *= -1;
		}
		return step;
	}

	private clampValue(): void {
		if (this.value.min && isNaN(this.value.min)) {
			this.value.min = undefined;
		}
		if (this.value.max && isNaN(this.value.max)) {
			this.value.max = undefined;
		}

		if (this.value.min && this.default.min) {
			// reset to infinite
			if (Math.abs(this.value.min) > Math.abs(this.default.min)) {
				this.value.min = undefined;
			}

			if (this.value.min) {
				// if positive - stay positive!
				if (this.default.min >= 0 && this.value.min < 0) {
					this.value.min = 0;
				}

				// if negative - stay negative!
				if (this.default.min < 0 && this.value.min > 0) {
					this.value.min = 0;
				}
			}
		}

		if (this.value.max && this.default.max) {
			// reset to infinite
			if (this.value.max && this.default.max && Math.abs(this.value.max) < Math.abs(this.default.max)) {
				this.value.max = undefined;
			}

			if (this.value.max) {
				// if positive - stay positive!
				if (this.default.max > 0 && this.value.max < 0) {
					this.value.max = 0;
				}

				// if negative - stay negative!
				if (this.default.max <= 0 && this.value.max > 0) {
					this.value.max = 0;
				}
			}
		}
	}

	private init(): void {
		this.disabled = this.query.disabled;
		const predeterminedValues = this.value.value && this.value.min && this.value.max;
		this.parsed = this.value.value ?? ItemParserUtils.parseNumberSimple(this.value.text);
		this.value.min = this.value.min || this.parsed;
		this.value.max = this.value.max || this.parsed;
		this.default = { ...this.value };

		if (this.disabled || predeterminedValues) {
			return;
		}

		if (this.minRange === 0.5) {
			this.value.min = undefined;
		} else {
			this.value.min -= this.parsed * this.minRange;
			if (Number.isInteger(this.parsed)) {
				this.value.min = Math.floor(this.value.min);
			} else {
				this.value.min = Math.floor(this.value.min * 10) / 10;
			}
		}

		if (this.maxRange === 0.5) {
			this.value.max = undefined;
		} else {
			this.value.max += this.parsed * this.maxRange;
			if (Number.isInteger(this.parsed)) {
				this.value.max = Math.ceil(this.value.max);
			} else {
				this.value.max = Math.ceil(this.value.max * 10) / 10;
			}
		}

		this.clampValue();
		this.emitChange();
	}

	private emitChange(): void {
		this.valueChange.emit(this.value);
		this.query.checkChange();
	}
}
