import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'cometchat-decorator-message',
  templateUrl: './cometchat-decorator-message.component.html',
  styleUrls: ['./cometchat-decorator-message.component.scss']
})
export class CometChatDecoratorMessageComponent implements OnInit {

  @Input() background:string = "transparent"
	@Input() textColor:string = "rgba(20, 20, 20, 0.33)"
	@Input() textFont:string = "600 22px Inter, sans-serif"
	@Input() text:string = "";

  constructor() { }

/**
 * 
 * CometChatDecoratorMessageCOmponent is used to show message for different states eg - loading,error,empty.
 * 
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */

  ngOnInit(): void {
  }

  getStyle = ()=>{
   return {
    backgroundColor: this.background,
    color: this.textColor,
    font: this.textFont,


   }
  }

}
