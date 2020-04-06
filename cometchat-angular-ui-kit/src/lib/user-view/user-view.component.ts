import { Component, OnInit, Input, ElementRef, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() user: CometChat.User | any;
  nativeRef: ElementRef;
  @Input() selected?: boolean;
  constructor(elm: ElementRef) {
    this.nativeRef = elm;
  }

  ngOnInit() {
    this.user = Object.assign(JSON.parse(this.user) as CometChat.User);
  }
}
