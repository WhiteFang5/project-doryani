import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { MaterialModule } from "@shared/material/material.module";

@NgModule({
	exports: [
		// default
		CommonModule,
		FormsModule,

		// third party
		//NgxChartsModule,//TODO: Used for currency exchange rate (poe ninja line charts)
		TranslateModule,

		// modules
		MaterialModule,
	],
})
export class SharedModule { }
