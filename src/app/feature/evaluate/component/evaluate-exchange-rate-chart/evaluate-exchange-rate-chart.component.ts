import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { ItemExchangeRateResult } from '@shared/item/type';

@Component({
	selector: 'app-evaluate-exchange-rate-chart',
	templateUrl: './evaluate-exchange-rate-chart.component.html',
	styleUrls: ['./evaluate-exchange-rate-chart.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluateExchangeRateChartComponent {
	private _result!: ItemExchangeRateResult;
	private _inverse!: boolean;
	private _name!: string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public items!: any[];
	public view = [140, 60];
	//TODO: Fix charts
	//public scheme = colorSets.find((x) => x.name === 'nightLights');
	//public curve = shape.curveNatural;
	public yScaleMin = 0;
	public yScaleMax = 0;

	@HostBinding('style.width')
	public width = `${this.view[0] - 30}px`;

	@HostBinding('style.height')
	public height = `${this.view[1] - 20}px`;

	@HostBinding('style.display')
	public display = 'inline-block';

	@Input()
	public set result(result: ItemExchangeRateResult) {
		this._result = result;
		this.update();
	}

	public get result(): ItemExchangeRateResult {
		return this._result;
	}

	@Input()
	public set inverse(inverse: boolean) {
		this._inverse = inverse;
		this.update();
	}

	public get inverse(): boolean {
		return this._inverse;
	}

	@Input()
	public set name(name: string) {
		this._name = name;
		this.update();
	}

	public get name(): string {
		return this._name;
	}

	private update(): void {
		if (!this.result.history || !this.result.change || !this.name) {
			this.display = 'none';
			return;
		} else {
			this.display = 'inline-block';
		}

		let base = (this.inverse ? this.result.inverseAmount : this.result.amount) || 1;
		base /= 1 + this.result.change / 100;

		this.yScaleMin = Number.MAX_SAFE_INTEGER;
		this.yScaleMax = Number.MIN_SAFE_INTEGER;

		this.items = [
			{
				name: this.name,
				series: this.result.history.map((value, index) => {
					const day = 6 - index;
					value = base * (1 + value / 100);

					if (value > this.yScaleMax) {
						this.yScaleMax = value;
					}
					if (value < this.yScaleMin) {
						this.yScaleMin = value;
					}

					return {
						name: day === 0 ? 'now' : `-${day} d`,
						value: Math.round(value * 100) / 100,
					};
				}),
			},
		];

		this.yScaleMin *= 0.9;
		this.yScaleMax *= 1.1;
	}
}
