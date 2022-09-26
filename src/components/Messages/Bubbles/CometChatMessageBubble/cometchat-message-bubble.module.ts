import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageBubbleComponent } from "./cometchat-message-bubble/cometchat-message-bubble.component";
import { CometChatMessageReceipt } from "../../../Shared/SecondaryComponents/CometChatMessageReceipt/cometchat-message-receipt.module";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";
import { CometChatAudioBubble } from "../CometChatAudioBubble/cometchat-audio-bubble.module";
import { CometChatFileBubble } from "../CometChatFileBubble/cometchat-file-bubble.module";
import { CometChatImageBubble } from "../CometChatImageBubble/cometchat-image-bubble.module";
import { CometChatTextBubble } from "../CometChatTextBubble/cometchat-text-bubble.module";
import { CometChatVideoBubble } from "../CometChatVideoBubble/cometchat-video-bubble.module";
import { CometChatPollBubble } from "../CometChatPollBubble/cometchat-poll-bubble.module";
import { CometChatStickerBubble } from "../CometChatStickerBubble/cometchat-sticker-bubble.module";
import { CometChatDate } from "../../../Shared/SecondaryComponents/CometChatDate/cometchat-date.module";
import { CometChatDivider } from "../../../Shared/UtilityComponents/CometChatDivider/cometchat-divider.module";
import { CometChatMenuList } from "../../../Shared/UtilityComponents/CometChatMenuList/cometchat-menu-list.module";
import { CometChatMessageReaction } from "../../CometChatMessageReaction/cometchat-message-reaction.module";
import { CometChatDeleteBubble } from "../CometChatDeleteBubble/cometchat-delete-bubble.module";
import { CometChatListItem } from "../../../Shared";
import { CometChatGroupActionBubble } from "../CometChatGroupActionBubble/cometchat-group-action-bubble.module";
import { CometChatPlaceholderBubble } from "../CometChatPlaceHolderBubble/cometchat-placeholder-bubble.module";
import { CometChatDocumentBubble } from "../CometChatDocumentBubble/cometchat-document-bubble.module";
import { CometChatWhiteboardBubble } from "../CometChatWhiteboardBubble/cometchat-whiteboard-bubble.module";
@NgModule({
  declarations: [CometChatMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
    CometChatMessageReceipt,
    CometChatAudioBubble,
    CometChatFileBubble,
    CometChatImageBubble,
    CometChatTextBubble,
    CometChatVideoBubble,
    CometChatPollBubble,
    CometChatStickerBubble,
    CometChatDate,
    CometChatDivider,
    CometChatMenuList,
    CometChatMessageReaction,
    CometChatDeleteBubble,
    CometChatListItem,
    CometChatGroupActionBubble,
    CometChatPlaceholderBubble,
    CometChatDocumentBubble,
    CometChatWhiteboardBubble
  ],
  exports: [CometChatMessageBubbleComponent],
})
export class CometChatMessageBubble {}