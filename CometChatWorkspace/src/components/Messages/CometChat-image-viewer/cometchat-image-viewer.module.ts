import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatImageViewerComponent } from "./cometchat-image-viewer/cometchat-image-viewer.component";
import { CometChatBackdrop } from "../../Shared/CometChat-backdrop/cometchat-backdrop.module";

@NgModule({
  declarations: [CometChatImageViewerComponent],
  imports: [CommonModule, CometChatBackdrop],
  exports: [CometChatImageViewerComponent],
})
export class CometChatImageViewer {}
