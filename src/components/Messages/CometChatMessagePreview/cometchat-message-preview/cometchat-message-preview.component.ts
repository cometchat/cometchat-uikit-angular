import { Component, OnInit, Input } from '@angular/core';
import { CometChatTheme, fontHelper } from '../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
import { messagePreviewStyle } from '../../CometChatMessageComposer/interface';
  /**
*
* CometChatMessagePreview is used to show message preview while editing message
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-message-preview',
  templateUrl: './cometchat-message-preview.component.html',
  styleUrls: ['./cometchat-message-preview.component.scss']
})
export class CometChatMessagePreviewComponent implements OnInit {
   /**
   * This properties will come from Parent.
   */
  @Input() messagePreviewTitle = "Edit Message";
  @Input() messagePreviewSubtitle = "";
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() messagePreviewCloseButtonIconURL = "assets/resources/close.svg";
  @Input() style: messagePreviewStyle = {
    messagePreviewBorder: "none",
    messagePreviewBackground: "white",
    messagePreviewTitleFont: "500 12px Inter, sans-serif",
    messagePreviewTitleColor: "grey",
    messagePreviewSubtitleColor: "grey",
    messagePreviewSubtitleFont: "400 13px Inter, sans-serif",
    messagePreviewCloseButtonIconTint: "grey",
  }
  @Input() onCloseClick!: () => void;
  @Input() showMessagePreview: boolean = false;
  constructor() { }
  ngOnInit(): void {
  }
  closeMessagePreview() {
    this.showMessagePreview = false;
    if (this.onCloseClick) {
      this.onCloseClick();
    }
  }
  /**
  * Props dependent styles for the CometChatMessagePreviewComponent.
  *
  */
  messagePreviewStyle: any = {
    closeBtnIconStyle: () => {
      return {
        WebkitMask: `url(${this.messagePreviewCloseButtonIconURL}) `,
        background: this.style.messagePreviewCloseButtonIconTint || this.theme.palette.getAccent500(),
      }
    },
    subtitleStyle: () => {
      return {
        font: this.style.messagePreviewSubtitleFont ||  fontHelper(this.theme.typography.subtitle2),
        color: this.style.messagePreviewSubtitleColor || this.theme.palette.getAccent500()
      }
    },
    titleStyle: () => {
      return {
        font: this.style.messagePreviewTitleFont || fontHelper(this.theme.typography.caption1),
        color: this.style.messagePreviewTitleColor || this.theme.palette.getAccent500()
      }
    },
    previewWrapperStyle: () => {
      return {
        background: this.style.messagePreviewBackground || this.theme.palette.getAccent900(),
        border: this.style.messagePreviewBorder,
      }
    }
  }
}
