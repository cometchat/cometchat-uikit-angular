import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CometChat } from "@cometchat-pro/chat";
import { groupActionStyles, styles } from '../../styles';

@Component({
  selector: 'cometchat-group-action-bubble',
  templateUrl: './cometchat-group-action-bubble.component.html',
  styleUrls: ['./cometchat-group-action-bubble.component.scss']
})
export class CometChatGroupActionBubbleComponent implements OnInit,OnChanges {
  @Input() messageObject!:CometChat.BaseMessage;
  @Input() text:string="";
  @Input() loggedInUser!:CometChat.User | null;
  @Input() style:groupActionStyles = {
	width :"", 
	height :"", 
	border :"", 
	background :"", 
	borderRadius :"", 
	textFont :"", 
	textColor :"", 
  }
  actionMessage:string | null= "";

  constructor() { }
	ngOnChanges(changes: SimpleChanges): void {
		if(changes["messageObject"] || changes["text"]){
			if(changes["text"] && changes["text"].currentValue != this.text){
				this.text = changes["text"].currentValue
				this.actionMessage = this.text
			}
			else{
				this.getActionMessage(this.messageObject)
			}

		}
	}

  ngOnInit(): void {
  }

  getActionMessage(message: CometChat.BaseMessage) {

    let actionMessage = null;

		const byUser = (message as any).actionBy?.name;
		const onUser = (message as any).actionOn?.name;

    switch ((message as any).action) {
			case CometChat.ACTION_TYPE.MEMBER_JOINED:
				actionMessage = `${byUser} JOINED`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_LEFT:
				actionMessage = `${byUser} LEFT`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_ADDED:
				actionMessage = `${byUser} ADDED ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_KICKED:
				actionMessage = `${byUser} KICKED ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_BANNED:
				actionMessage = `${byUser} BANNED ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
				actionMessage = `${byUser} UNBANNED ${onUser}`;
				break;
			case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
				const newScope = (message as any).newScope;
				actionMessage = `${byUser} MADE ${onUser} ${newScope}`;
				break;
			}
			default:
				break;
		}
		this.actionMessage = actionMessage;
  }
  actionMessageStyles = ()=>{

	  return {
		  color:this.style.textColor,
		  font:this.style.textFont,
		  background:this.style.background
	  }
  }

}
