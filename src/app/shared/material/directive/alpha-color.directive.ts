import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Color, ColorUtils } from '@core/class/color.class';

@Directive({
	selector: '[appAlphaColor]',
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class AlphaColorDirective implements OnInit, OnChanges {
	private element!: HTMLElement;

	@Input('appAlphaColor')
	public stylePropertyNames!: string[];

	// eslint-disable-next-line @angular-eslint/no-input-rename
	@Input('appAlphaColor.baseColors')
	public baseColors?: Color[];

	// eslint-disable-next-line @angular-eslint/no-input-rename
	@Input('appAlphaColor.alpha')
	public alpha = 1;

	constructor(private readonly elementRef: ElementRef<HTMLElement>) { }

	public ngOnInit(): void {
		this.element = this.element || this.elementRef.nativeElement;

		this.onChanged();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public ngOnChanges(changes: SimpleChanges): void {
		this.onChanged();
	}

	private onChanged(): void {
		if (!this.element || !this.stylePropertyNames) {
			return;
		}

		this.stylePropertyNames.forEach((stylePropertyName) =>
			this.element.style.removeProperty(stylePropertyName)
		);

		const computedStyle = getComputedStyle(this.element);
		this.stylePropertyNames.forEach((stylePropertyName, index) => {
			const colorString = computedStyle.getPropertyValue(stylePropertyName);
			let color = ColorUtils.fromString(colorString);
			if (this.baseColors && this.baseColors[index]) {
				color = this.baseColors[index];
			}
			color.a *= this.alpha;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.element.style[stylePropertyName as any] = ColorUtils.toRGBA(color);
		});
	}
}
