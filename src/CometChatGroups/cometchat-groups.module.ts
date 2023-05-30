import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupsComponent } from "./cometchat-groups/cometchat-groups.component";
import { CometChatList } from "../CometChatList/cometchat-list.module";
import  "my-cstom-package-lit";
@NgModule({
  declarations: [CometChatGroupsComponent],
  imports: [
    CommonModule,
CometChatList,
  ],
  exports: [CometChatGroupsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatGroups {}
