import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

const KEY_CODES = /^(F24|F23|F22|F21|F20|F19|F18|F17|F16|F15|F14|F13|F12|F11|F10|F9|F8|F7|F6|F5|F4|F3|F2|F1|End|Home|Insert|Delete|PageUp|PageDown|[0-9A-Z]|[`|<])$/;

const PRESERVERED_ACCELERATORS = ['CmdOrCtrl + C', 'CmdOrCtrl + V', 'Alt + F4'];

@Component({
	selector: 'app-accelerator',
	templateUrl: './accelerator.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	// eslint-disable-next-line @angular-eslint/prefer-standalone
	standalone: false,
})
export class AcceleratorComponent {
	@Input()
	public label!: string;

	@Input()
	public value: string | undefined;

	@Output()
	public valueChange = new EventEmitter<string | undefined>();

	public recording = false;
	public valueBackup: string | undefined;

	public onKeyboardClick(el: HTMLElement): void {
		this.recording = true;
		el.focus();
		this.valueBackup = this.value;
		this.value = 'material.accelerator.any';
	}

	public cancelSetShortcut(): void {
		this.recording = false;
		this.value = this.valueBackup;
	}

	public onKeydown(event: KeyboardEvent): void {
		event.preventDefault();

		if (this.recording) {
			let key = event.key || '';
			if (key.length === 1) {
				key = key.toUpperCase();
			}
			if (KEY_CODES.test(key)) {
				this.recording = false;

				switch (event.code) {
					case 'Numpad0':
						key = 'num0';
						break;
					case 'Numpad1':
						key = 'num1';
						break;
					case 'Numpad2':
						key = 'num2';
						break;
					case 'Numpad3':
						key = 'num3';
						break;
					case 'Numpad4':
						key = 'num4';
						break;
					case 'Numpad5':
						key = 'num5';
						break;
					case 'Numpad6':
						key = 'num6';
						break;
					case 'Numpad7':
						key = 'num7';
						break;
					case 'Numpad8':
						key = 'num8';
						break;
					case 'Numpad9':
						key = 'num9';
						break;
				}

				const modifiers = [];
				if (event.ctrlKey) {
					modifiers.push('CmdOrCtrl');
				}
				if (event.altKey) {
					modifiers.push('Alt');
				}
				if (event.shiftKey) {
					modifiers.push('Shift');
				}
				modifiers.push(key);
				const value = modifiers.join(' + ');
				if (!PRESERVERED_ACCELERATORS.includes(value)) {
					this.value = value;
					this.valueChange.next(this.value);
				} else {
					this.recording = true;
				}
			} else if (key === 'Esc' || key === 'Escape') {
				this.recording = false;
				this.value = undefined;
				this.valueChange.next(this.value);
			} else {
				this.value = 'material.accelerator.any';
			}
		}
	}
}
