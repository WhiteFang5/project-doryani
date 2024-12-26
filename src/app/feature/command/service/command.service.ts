import { Injectable } from '@angular/core';
import { ClipboardService, KeyboardService } from '@core/service/input';
import { PoEAccountService } from '@shared/poe-account/service/poe-account.service';
import { TradeRegexesProvider } from '@shared/provider';
import { GameLogService } from '@shared/service/game-log.service';
import { KeyCode, UserSettings } from '@shared/type';
import { Subject, delay, map, tap, throttleTime } from 'rxjs';

interface Command {
	text: string;
	send: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class CommandService {
	private readonly command$ = new Subject<Command>();

	private lastIncomingWhisperer?: string;

	constructor(
		private readonly clipboard: ClipboardService,
		private readonly keyboard: KeyboardService,
		private readonly accountService: PoEAccountService,
		gameLogService: GameLogService,
		tradeRegexesProvirder: TradeRegexesProvider
	) {
		const tradeRegexStrings = tradeRegexesProvirder.provide();
		const whisperRegex = new RegExp(tradeRegexStrings.all + tradeRegexStrings.whisper, 'i');

		gameLogService.logLineAdded.subscribe((logLine) => {
			if (whisperRegex.test(logLine)) {
				const from = whisperRegex.exec(logLine)?.groups?.['player'];
				if (from) {
					this.lastIncomingWhisperer = from;
				}
			}
		});

		this.command$
			.pipe(
				throttleTime(350),
				map((command) => {
					const text = this.clipboard.readText();
					this.clipboard.writeText(command.text);
					this.keyboard.keyTap(KeyCode.Enter);
					this.keyboard.keyTap(KeyCode.V, [KeyCode.Ctrl]);
					if (command.send) {
						this.keyboard.keyTap(KeyCode.Enter);
					}
					return text;
				}),
				delay(200),
				tap((text) => {
					this.clipboard.writeText(text);
				})
			)
			.subscribe();
	}

	public command(command: string, userSettings: UserSettings, preProcessCommand = false, send = true): void {
		if (preProcessCommand) {
			command = this.preProcessCharacterNameCommand(command, userSettings);
			command = this.preProcessLastWhispererCommand(command);
		}
		this.command$.next({ text: command, send });
	}

	private preProcessCharacterNameCommand(command: string, userSettings?: UserSettings): string {
		if (userSettings) {
			let activeCharacterName = userSettings.activeCharacterName;
			if (!activeCharacterName) {
				activeCharacterName = this.accountService.getActiveCharacter()?.name;
			}
			if (activeCharacterName) {
				command = command.replace("@me", activeCharacterName);
			}
		}
		return command;
	}

	private preProcessLastWhispererCommand(command: string): string {
		if (this.lastIncomingWhisperer) {
			command = command.replace("@last", this.lastIncomingWhisperer);
		}
		return command;
	}
}
