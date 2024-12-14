import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverlayComponent } from '@feature/overlay/overlay.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AppTranslationsLoader } from './app-translations.loader';
import { AppComponent } from './app.component';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [
	{
		path: '**',
		component: OverlayComponent,
	},
];

@NgModule({
	declarations: [AppComponent],
	imports: [
		// routing
		RouterModule.forRoot(routes, {
			useHash: true,
		}),

		// translate
		TranslateModule.forRoot({
			loader: { provide: TranslateLoader, useClass: AppTranslationsLoader },
		}),

		// app
		OverlayComponent,
	],
	bootstrap: [AppComponent],
})
export class AppModule { }
