import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { ItemSearchAnalyzeResult, SearchAnalyzeEntryGrouped } from '@shared/item/type';
import { SharedModule } from '@shared/shared.module';

@Component({
	selector: 'app-evaluate-search-chart',
	templateUrl: './evaluate-search-chart.component.html',
	styleUrls: ['./evaluate-search-chart.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class EvaluateSearchChartComponent {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public items?: any[];
	public view = [376 + 20, 200];
	//TODO: Fix charts
	//public scheme = colorSets.find((x) => x.name === 'nightLights');
	public groups: Record<number, SearchAnalyzeEntryGrouped> = {};
	public xAxisTickFormatting = this.format.bind(this);

	@HostBinding('style.width')
	public width = `${this.view[0]}px`;

	@HostBinding('style.height')
	public height = `${this.view[1]}px`;

	@HostBinding('style.display')
	public display = 'block';

	@Input()
	public set result(result: ItemSearchAnalyzeResult) {
		this.update(result);
	}

	@Output()
	public amountSelect = new EventEmitter<number>();

	public onSelect(event: { name: number; }): void {
		this.amountSelect.emit(event.name);
	}

	public format(value: number): string {
		const group = this.groups[value];
		const length = group.items.length + group.hidden;
		const hidden = group.hidden;
		if (hidden >= length * 0.75) {
			return `${value}***`;
		} else if (hidden >= length * 0.5) {
			return `${value}**`;
		} else if (hidden >= length * 0.25) {
			return `${value}*`;
		}
		return `${value}`;
	}

	private update(result: ItemSearchAnalyzeResult): void {
		if (!result.entryGroups) {
			this.display = 'none';
			this.items = [];
		} else {
			this.display = 'block';
			this.groups = {};
			this.items = result.entryGroups.map((x) => {
				this.groups[x.value] = x;
				return { name: x.value, value: x.items.length };
			});
		}
	}
}
