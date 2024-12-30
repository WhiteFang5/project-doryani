import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Currency, CurrencyRange } from '@shared/currency/type';
import { SharedModule } from '@shared/shared.module';

@Component({
	selector: 'app-currency-frame',
	templateUrl: './currency-frame.component.html',
	styleUrls: ['./currency-frame.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class CurrencyFrameComponent {
	@Input()
	public currency?: Currency;

	@Input()
	public amount?: number;

	@Input()
	public label?: string;

	@Input()
	public range?: CurrencyRange;

	@Input()
	public count?: number;
}
