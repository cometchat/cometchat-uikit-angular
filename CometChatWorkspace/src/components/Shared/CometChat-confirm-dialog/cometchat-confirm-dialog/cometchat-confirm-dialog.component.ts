import { Component, Input, OnInit } from '@angular/core';
import { CometChatService } from './../../../../utils/cometchat.service';

@Component({
  selector: 'cometchat-confirm-dialog',
  templateUrl: './cometchat-confirm-dialog.component.html',
  styleUrls: ['./cometchat-confirm-dialog.component.css']
})
export class CometChatConfirmDialogComponent implements OnInit {
  @Input() message: string = '';
  @Input() confirmationButtonText: string = '';
  @Input() cancelButtonText: string = '';

  constructor(private CometChatService: CometChatService) { }

  ngOnInit() {

  }

  onButtonClick(value: string) {
    this.CometChatService.onConfirmDialogClick.next(value);
  }

}

