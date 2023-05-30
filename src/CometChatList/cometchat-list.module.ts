import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometchatListComponent } from "./cometchat-list.component";
import { FormsModule } from "@angular/forms";
import 'my-cstom-package-lit'
@NgModule({
  declarations: [CometchatListComponent],
  imports: [
    CommonModule,
    FormsModule,


  ],
  exports: [CometchatListComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],

})
export class CometChatList {}
