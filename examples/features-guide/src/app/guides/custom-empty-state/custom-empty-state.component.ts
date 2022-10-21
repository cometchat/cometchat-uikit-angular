import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'custom-empty-state',
  templateUrl: './custom-empty-state.component.html',
  styleUrls: ['./custom-empty-state.component.scss']
})
export class CustomEmptyStateComponent implements OnInit {
  tags:any = ["custom","dawd","dawdawd"]
  constructor() { }

  ngOnInit(): void {

  }

}
