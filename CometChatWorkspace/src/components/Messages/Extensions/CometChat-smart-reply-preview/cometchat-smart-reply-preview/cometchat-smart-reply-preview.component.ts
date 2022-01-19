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
import * as enums from "../../../../../utils/enums";
import { logger } from "../../../../../utils/common";
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

  options: any = [];

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.REPLY_PREVIEW]) {
        if (change[enums.REPLY_PREVIEW].currentValue) {
          this.generateSmartReplyOptions(
            change[enums.REPLY_PREVIEW].currentValue
          );
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      if (this.replyPreview) {
        this.generateSmartReplyOptions(this.replyPreview);
      }
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Generate the quick replies that the current user can use
   * @param Any message
   */
  generateSmartReplyOptions(message: any) {
    try {
      if (message.hasOwnProperty(enums.METADATA)) {
        const metadata = message[enums.METADATA];
        if (metadata.hasOwnProperty(enums.INJECTED)) {
          const injectedObject = metadata[enums.INJECTED];
          if (injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
            const extensionsObject = injectedObject[enums.EXTENSIONS];
            if (extensionsObject.hasOwnProperty(enums.SMART_REPLY)) {
              const smartReplyObject = extensionsObject[enums.SMART_REPLY];

              const options = [
                smartReplyObject[enums.REPLY_POSITIVE],
                smartReplyObject[enums.REPLY_NEUTRAL],
                smartReplyObject[enums.REPLY_NEGATIVE],
              ];

              this.options = options;
            }
          }
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Sends the selected option as reply
   * @param
   */
  sendReplyMessage(message: any) {
    try {
      this.actionGenerated.emit({
        type: enums.SEND_SMART_REPLY,
        payLoad: message,
      });
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Closes the reply preview window
   * @param
   */
  closeReplyPreview() {
    try {
      this.replyPreview = null;
    } catch (error) {
      logger(error);
    }
  }
}
