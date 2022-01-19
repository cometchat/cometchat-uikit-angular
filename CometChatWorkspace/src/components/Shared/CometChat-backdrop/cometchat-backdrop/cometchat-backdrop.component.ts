import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "cometchat-backdrop",
  templateUrl: "./cometchat-backdrop.component.html",
  styleUrls: ["./cometchat-backdrop.component.css"],
})
export class CometChatBackdropComponent implements OnInit {
  @Input() show: any;
  constructor() {}

  ngOnInit() {}
}
