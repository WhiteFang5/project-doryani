import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * @deprecated
 */
@Component({
	selector: 'app-card',
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class CardComponent {
	@Input()
	public title!: string;
}
