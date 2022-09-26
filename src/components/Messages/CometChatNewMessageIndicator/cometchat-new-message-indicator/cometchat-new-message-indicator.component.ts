import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
} from "@angular/core";
  /**
 * 
 * CometChatNewMessageIndicator component is used to show new messages count on chat screen if user is not at the bottom of the chat and gets new message
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
@Component({
  selector: "cometchat-new-message-indicator",
  templateUrl: "./cometchat-new-message-indicator.component.html",
  styleUrls: ["./cometchat-new-message-indicator.component.scss"],
})
export class CometChatNewMessageIndicatorComponent implements OnInit {
        /**
   * This properties will come from Parent.
   */
  @Input() unreadCount:number = 0 //unreadCount of message
  @Input() text:string = ""; //text to show on screen
  @Input() icon:string = "";
  @Input() onClick:Function = ()=>{}; //callback on click of screen
  @Input() style:any = {} //styling for font , color,border,background
  constructor() {}

   ngOnInit() {}
  ngOnChanges(change: SimpleChanges) {}
  newMessageStyle(){
    return {
      color:this.style.textColor,
      font:this.style.textFont,
      background:this.style.background
    }
  }
  scrollToBottomOfChatWindow(){}
}
