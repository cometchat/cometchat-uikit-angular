import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "cometchat-read-reciept",
  templateUrl: "./cometchat-read-reciept.component.html",
  styleUrls: ["./cometchat-read-reciept.component.css"],
})
export class CometChatReadRecieptComponent implements OnInit {
  @Input() MessageDetails = null;
  @Input() displayReadReciept = true;
  msgSent: boolean = false;
  msgRead: boolean = false;
  msgDeliv: boolean = false;
  tickStatus: string = "read";
  constructor() {}

  ngOnInit() {
    this.getTick();
  }
  /**
   * Get  Time for message sending
   */
  getTime() {
    let msgSentAt = this.MessageDetails.sentAt;
    msgSentAt = msgSentAt * 1000;

    return msgSentAt;
  }
  /**
   * Get Read/Deliv/Sent Status
   */
  getTick() {
    let sentAt = this.MessageDetails.sentAt;
    let readAt = this.MessageDetails.readAt;
    let delivAt = this.MessageDetails.deliveredAt;
    if (sentAt && !readAt && !delivAt) {
      this.tickStatus = "sent";
    }
    if (sentAt && !readAt && delivAt) {
      this.tickStatus = "deliv";
    }
  }
}
