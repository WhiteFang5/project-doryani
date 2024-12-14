import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { Point } from '@shared/type';
import { DirectiveUtils } from './directive-utils.directive';

@Directive({
	selector: '[appDrag]',
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class DragDirective implements OnInit, OnDestroy {
	private element: HTMLElement | null = null;

	private pressed = false;
	private dragging = false;

	private pointerPosition?: Point;
	private position?: Point;

	@Input('appDrag')
	public rootElementSelector!: string;

	constructor(private readonly elementRef: ElementRef<HTMLElement>) { }

	public ngOnInit(): void {
		if (this.rootElementSelector) {
			this.element = DirectiveUtils.getClosestMatchingAncestor(
				this.elementRef.nativeElement,
				this.rootElementSelector
			);
		}
		this.element = this.element || this.elementRef.nativeElement;
		this.element.addEventListener('mousedown', this.mousedown, true);
		this.element.addEventListener('mouseup', this.mouseup, true);
		this.element.addEventListener('mousemove', this.mousemove, true);
	}

	public ngOnDestroy(): void {
		if (this.element) {
			this.element.removeEventListener('mousedown', this.mousedown);
			this.element.removeEventListener('mouseup', this.mouseup);
			this.element.removeEventListener('mousemove', this.mousemove);
		}
	}

	private mousedown = (event: MouseEvent) => {
		if (!this.element) {
			return;
		}
		this.pressed = true;
		this.pointerPosition = {
			x: event.pageX,
			y: event.pageY,
		};
		this.position = {
			x: +this.element.style.marginLeft.replace('px', ''),
			y: +this.element.style.marginTop.replace('px', ''),
		};
	};

	private mouseup = () => {
		this.pressed = false;
		this.dragging = false;
	};

	private mousemove = (event: MouseEvent) => {
		if (!this.pressed || !this.element || !this.pointerPosition || !this.position) {
			return;
		}

		if (!this.dragging) {
			const distanceX = Math.abs(event.pageX - this.pointerPosition.x);
			const distanceY = Math.abs(event.pageY - this.pointerPosition.y);

			const isOverThreshold = distanceX + distanceY >= 5;
			if (isOverThreshold) {
				this.dragging = true;
			}
		}

		if (!this.dragging) {
			return;
		}

		event.preventDefault();
		event.stopImmediatePropagation();

		const delta: Point = {
			x: event.pageX - this.pointerPosition.x,
			y: event.pageY - this.pointerPosition.y,
		};

		this.element.style.marginLeft = `${this.position.x + delta.x}px`;
		this.element.style.marginTop = `${this.position.y + delta.y}px`;
	};
}
