import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UiLanguage } from '@shared/type';

@Injectable({
	providedIn: 'root',
})
export class AppTranslateService {
	constructor(
		private readonly translate: TranslateService
	) {
		this.translate.setDefaultLang(`${UiLanguage.English}`);
	}

	public get(key: string, interpolateParams?: object): string {
		return this.translate.instant(key, interpolateParams);
	}

	public use(language: UiLanguage): void {
		this.translate.use(`${language}`);
	}
}
