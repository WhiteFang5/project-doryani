import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { ItemFrameComponent } from '@shared/item/component/item-frame/item-frame.component';
import { Item, ItemSocket, ItemSocketColor } from '@shared/item/type';
import { SharedModule } from '@shared/shared.module';

@Component({
	selector: 'app-item-frame-sockets',
	templateUrl: './item-frame-sockets.component.html',
	styleUrls: ['./item-frame-sockets.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [SharedModule],
})
export class ItemFrameSocketsComponent {
	@Input()
	public item!: Item;

	@Input()
	public queryItem!: Item;

	constructor(
		@Inject(ItemFrameComponent)
		private readonly itemFrame: ItemFrameComponent
	) { }

	public toggleSocketColor(event: MouseEvent, index: number): void {
		if (!this.queryItem.sockets || !this.item.sockets) {
			return;
		}

		let newColor: ItemSocketColor | undefined;
		if (event.shiftKey) {
			const isEnabled = this.queryItem.sockets.every((x) => x.color !== undefined);
			const isColorless = isEnabled && this.queryItem.sockets.every((x) => x.color === ItemSocketColor.Any);
			for (let i = 0; i < this.queryItem.sockets.length; i++) {
				if (!isEnabled) {
					newColor = ItemSocketColor.Any;
				} else if (isColorless) {
					newColor = this.item.sockets[i].color;
				} else {
					newColor = undefined;
				}
				this.queryItem.sockets[i].color = newColor;
			}
		} else {
			switch (this.queryItem.sockets[index].color) {
				case ItemSocketColor.Any:
					newColor = this.item.sockets[index].color;
					break;
				case null:
				case undefined:
					newColor = ItemSocketColor.Any;
					break;
				default:
					newColor = undefined;
					break;
			}
			this.queryItem.sockets[index].color = newColor;
		}
		this.itemFrame.onPropertyChange();
	}

	public toggleSocketLinked(event: MouseEvent, index: number, value: ItemSocket): void {
		if (!this.queryItem.sockets || !this.item.sockets) {
			return;
		}

		if (event.shiftKey) {
			const enabled = this.queryItem.sockets.every((x) => x.linked !== undefined);
			for (let i = 0; i < this.queryItem.sockets.length; i++) {
				this.queryItem.sockets[i].linked = enabled ? undefined : this.item.sockets[i].linked;
			}
		} else {
			this.queryItem.sockets[index] = this.toggleSocket(
				this.queryItem.sockets[index],
				value,
				'linked'
			);
		}
		this.itemFrame.onPropertyChange();
	}

	public getSocketTop(index: number, offset = 0): string {
		return `${Math.floor(index / 2) * 56 + offset}px`;
	}

	public getSocketHeight(): string {
		const length = this.item.sockets?.length || 0;
		const socketHeight = Math.floor((length + 1) / 2) * 34;
		const linkHeight = length >= 3 ? Math.floor((length - 1) / 2) * 22 : 0;
		return `${socketHeight + linkHeight}px`;
	}

	public getSocketName(socket: ItemSocket): string {
		if (!socket || !socket.color || socket.color == ItemSocketColor.Delve) {
			return '';
		}
		return socket.color;
	}

	private toggleSocket(socket: ItemSocket, value: ItemSocket, property: string): ItemSocket {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (!socket || !(socket as any)[property]) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return { ...socket, [property]: (value as any)[property] };
		}
		return { ...socket, [property]: null };
	}
}
