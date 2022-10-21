import {
  Component,
  Input,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { CometChatTheme, fontHelper } from "../../../Shared";
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
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() style:any = {} //styling for font , color,border,background
  constructor() {}

   ngOnInit() {}
  ngOnChanges(change: SimpleChanges) {}
  newMessageStyle(){
    return {
      color:this.style.textColor || this.theme.palette.getAccent900("light"),
      font:this.style.textFont ||  fontHelper(this.theme.typography.title2),
      background:this.style.background || this.theme.palette.getPrimary()
    }
  }
  scrollToBottomOfChatWindow(){}
}
