import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "cometchat-badge-count",
  templateUrl: "./cometchat-badge-count.component.html",
  styleUrls: ["./cometchat-badge-count.component.css"],
})
export class CometChatBadgeCountComponent implements OnInit {
  @Input() count = null;

  constructor() {}

  ngOnInit() {}
}
