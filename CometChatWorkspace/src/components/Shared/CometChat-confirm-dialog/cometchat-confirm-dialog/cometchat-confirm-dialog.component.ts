import { Component, Input, OnInit } from '@angular/core';
import { CometChatService } from './../../../../utils/cometchat.service';

@Component({
  selector: 'cometchat-confirm-dialog',
  templateUrl: './cometchat-confirm-dialog.component.html',
  styleUrls: ['./cometchat-confirm-dialog.component.css']
})
export class CometChatConfirmDialogComponent implements OnInit {
  @Input() message: string = null;
  @Input() confirmationButtonText: string = null;
  @Input() cancelButtonText: string = null;

  constructor(private CometChatService: CometChatService) { }

  ngOnInit() {

  }

  onButtonClick(value) {
    this.CometChatService.onConfirmDialogClick.next(value);
  }

}

