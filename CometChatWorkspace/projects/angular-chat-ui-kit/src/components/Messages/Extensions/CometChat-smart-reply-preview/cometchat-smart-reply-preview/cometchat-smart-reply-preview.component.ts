import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from "@angular/core";
import { trigger, style, transition, animate } from "@angular/animations";
import * as enums from "../../../../utils/enums";
@Component({
  selector: "cometchat-smart-reply-preview",
  templateUrl: "./cometchat-smart-reply-preview.component.html",
  styleUrls: ["./cometchat-smart-reply-preview.component.css"],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateY(100%)" }),
        animate("400ms ease-in", style({ transform: "translateY(0%)" })),
      ]),
    ]),
  ],
})
export class CometChatSmartReplyPreviewComponent implements OnInit {
  @Input() replyPreview = null;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  options = [];

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["replyPreview"]) {
      if (change["replyPreview"].currentValue) {
        this.generateSmartReplyOptions(change["replyPreview"].currentValue);
      }
    }
  }

  ngOnInit() {
    if (this.replyPreview) {
      this.generateSmartReplyOptions(this.replyPreview);
    }
  }

  /**
   * Generate the quick replies that the current user can use
   * @param Any message
   */
  generateSmartReplyOptions(message) {
    if (message.hasOwnProperty("metadata")) {
      const metadata = message.metadata;
      if (metadata.hasOwnProperty("@injected")) {
        const injectedObject = metadata["@injected"];
        if (injectedObject.hasOwnProperty("extensions")) {
          const extensionsObject = injectedObject["extensions"];
          if (extensionsObject.hasOwnProperty("smart-reply")) {
            const smartReplyObject = extensionsObject["smart-reply"];

            const options = [
              smartReplyObject["reply_positive"],
              smartReplyObject["reply_neutral"],
              smartReplyObject["reply_negative"],
            ];

            this.options = options;
          }
        }
      }
    }
  }

  /**
   * Sends the selected option as reply
   * @param
   */
  sendReplyMessage(message) {
    this.actionGenerated.emit({
      type: enums.SEND_SMART_REPLY,
      payLoad: message,
    });
  }

  /**
   * Closes the reply preview window
   * @param
   */
  closeReplyPreview() {
    this.replyPreview = null;
  }
}
