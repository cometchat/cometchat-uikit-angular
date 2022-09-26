import { Component, OnChanges, OnInit, SimpleChanges, Input, ChangeDetectionStrategy } from '@angular/core';
import { checkMessageForExtensionsData } from '../../../Shared/Helpers/CometChatHelper';
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service';
  /**
*
* CometChatMessageReaction is used to show reactions on message bubbles
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-message-reaction',
  templateUrl: './cometchat-message-reaction.component.html',
  styleUrls: ['./cometchat-message-reaction.component.scss'],
  // changeDetection: ChangeDetectionStrategy.Default,
})
export class CometChatMessageReactionComponent implements OnInit, OnChanges {
   /**
   * This properties will come from Parent.
   */
  @Input() messageObject: any = null;
  @Input() loggedInUser: any;
  @Input() updateReaction: any;
  @Input() addReactionIconURL: string = "assets/resources/addreaction.svg";
  @Input() style = {
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    background: "",
  }
  reactionIconStyle = {
    iconTint:"rgba(20, 20, 20, 0.58)"
  }
         /**
     * Properties for internal use
     */

  extensionData: any;
  reactionsName: any;
  messageReactions: any;
  count: any;
  constructor(private messageEvents:CometChatMessageEvents) { }
  ngOnInit(): void {
    try {
      this.extensionData = checkMessageForExtensionsData(
        this.messageObject,
        "reactions"
      );
      this.getMessageReactions(this.extensionData);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
 

    try {
      if (changes["messageObject"]) {
        if (
          changes["messageObject"].previousValue !==
          changes["messageObject"].currentValue
        ) {
          let extensionData = checkMessageForExtensionsData(
            this.messageObject,
            "reactions"
          );
          if (Object.keys(this.loggedInUser).length > 0) {
            this.getMessageReactions(extensionData);
          }
        }
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  getMessageReactions(reaction: any) {



    if (reaction === null) {
      return null;
    }
    let messageReactions: any = [];
    Object.keys(reaction).map((data, key) => {
  
      const reactionData = reaction[data];
      const reactionCount = Object.keys(reactionData).length;
      let showBlueOutline = false;
      if (reactionData.hasOwnProperty(this.loggedInUser.uid)) {
        showBlueOutline = true;
      }
      const reactionName = data;
      let messageReaction;
      const userList = [];
      let reactionTitle = "";
      for (const user in reactionData) {
        userList.push(reactionData[user]["name"]);
      }
      if (userList.length) {
        reactionTitle = userList.join(", ");
        reactionTitle = reactionTitle.concat(
          ` ${"reacted"}`
        );
      }
      if (reactionCount) {
        messageReaction = {
          reactionName,
          reactionCount,
          reactionTitle,
          showBlueOutline,
        };
      } else {
        messageReaction = { reactionName, reactionTitle, showBlueOutline };
      }
      messageReactions.push(messageReaction);
      
    }
    );

    this.messageReactions = messageReactions;
    return;
  }
  reactToMessages(emoji: any = null) {
    this.updateReaction(this.messageObject,null,emoji.reactionName)

  }
  

  messageReactionStyle: any = {
    addReactionButtonStyle: () => {
      return {
        width: "24px",
        height: "24px",
        display: "inline-block",
        WebkitMask: `url(${this.addReactionIconURL})`,
        background: "black",
      }
    },
    highlightBackground:(showOutline:boolean, count:any)=>{
      let style:any = {}
      if(showOutline){
        style = {
          border:"1px solid #39f",
          font:"400 12px Inter",
          background:"#f6f6f6"
        }

      }else{
        style = {
          border:"none",
          font:"400 12px Inter",
          background:"#f6f6f6"
        }

      }
   
      return{
        ...style,
        display: count ? "inline-flex" : "none"

      }
    },
    emojiButtonStyle:()=>{
      return{
        background:"#f6f6f6"

      }
    }
  }
}
