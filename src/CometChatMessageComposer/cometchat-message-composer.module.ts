import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageComposerComponent } from "./cometchat-message-composer/cometchat-message-composer.component";
import 'my-cstom-package-lit'
@NgModule({
  declarations: [CometChatMessageComposerComponent],
  imports: [
    CommonModule,
  ],
  exports: [CometChatMessageComposerComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatMessageComposer {}