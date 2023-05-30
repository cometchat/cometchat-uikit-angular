import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUsersComponent } from "./cometchat-users/cometchat-users.component";
import { FormsModule } from "@angular/forms";
import 'my-cstom-package-lit'
import { CometChatList } from "../CometChatList/cometchat-list.module";
@NgModule({
  declarations: [CometChatUsersComponent],
  imports: [
    CommonModule,
    FormsModule,
    CometChatList
  ],
  exports: [CometChatUsersComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatUsers {}
