import { provideHttpClient } from '@angular/common/http';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { BookmarkModule } from '@feature/bookmark/bookmark.module';
import { OverlayComponent } from '@feature/overlay/overlay.component';
import { UserSettingsComponent } from '@feature/user-settings/component/user-settings/user-settings.component';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { AppTranslationsLoader } from './app/app-translations.loader';
import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './environments/environment';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';

const routes: Routes = [
	{
		path: 'user-settings',
		component: UserSettingsComponent,
	},
	{
		path: '**',
		component: OverlayComponent,
	},
];

if (APP_CONFIG.production) {
	console.log('Running in production mode.');
	enableProdMode();
} else {
	console.log('Running in development mode.');
}

bootstrapApplication(AppComponent, {
	providers: [
		// Routes
		provideRouter(routes, withHashLocation()),

		// Http (required for web requests)
		provideHttpClient(),

		// Translations
		provideTranslateService({
			loader: { provide: TranslateLoader, useClass: AppTranslationsLoader },
		}),

		provideAnimations(),

		// Features (Modules)
		importProvidersFrom([BookmarkModule]),
	]
}).catch(err => console.error(err));
