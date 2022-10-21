import { Component, OnInit, Input } from '@angular/core';
import { Emojis } from "../emojis";
import { CometChatEmojiCategory } from "../emojiCategory";
import { CometChatEmoji } from "../emoji";
import { emojiKeyboardStyles } from '../interface';
import { CometChatTheme,fontHelper } from '../../../Shared';
  /**
*
* CometChatEmojiKeyboard is used to react to message or send emojis in chat
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-emoji-keyboard',
  templateUrl: './cometchat-emoji-keyboard.component.html',
  styleUrls: ['./cometchat-emoji-keyboard.component.scss'],
})
export class CometChatEmojiKeyboardComponent implements OnInit {
         /**
   * This properties will come from Parent.
   */
  @Input() hideSearch: boolean = true;
  @Input()  onClick!: (emoji:string)=>void;
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input()  style: emojiKeyboardStyles ={
    width: "100%",
    height: "100%",
    border: "none",
    textFont: "500 12px Inter, sans-serif",
    textColor: "",
    background: "",
    borderRadius: "12px",
  }
      /**
     * Properties for internal use
     */
       public emojiData:any[] = [];
  iconStyle: any = {
    iconTint:"",
  }
  activeIconStyle: any  = {
    iconTint:"",
  }
  objectKeys:any = Object.keys;

  activeCategory: string = "people";
  ngOnInit(): void {
    this.getEmojiCategory();
    this.iconStyle.iconTint =this.theme.palette.getAccent600();
    this.activeIconStyle.iconTint = this.theme.palette.getPrimary();
  
  }
  /**
   * @param  {CometChatEmoji} emojiData
   */
  getEmojiData(emojiData:CometChatEmoji){
    const emojiInstance = new CometChatEmoji({
      char: emojiData.char,
      keywords: emojiData.keywords
    });
    return emojiInstance.char
  }
  getEmojiCategory():any{
    this.emojiData = Emojis.map((el) => {
      const vals = Object.values(el)[0];
      const emojiCategory = new CometChatEmojiCategory({
        id: vals.id,
        name: vals.name,
        symbolURL: vals.symbol,
        emojies: vals.emojis,
      });
      return emojiCategory
    });
  }
  /**
   * @param  {string} id
   */
  scrollToElement(id:string) {
    this.activeCategory = id;
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
   /**
    * @param  {CometChatEmoji} emoji
    */
   onEmojiClick = (emoji:CometChatEmoji) => {
    this.onClick(emoji.char)
  };
 /**
   * Props dependent styles for the CometChatEmojiKeyboard.
   *
   */
styles:any = {
  emojiContainerStyle : () => {
    return {
      width: this.style.width,
      height: this.style.height,
      background:
        this.style?.background ||
        this.theme.palette.getBackground(),
        borderRadius:this.style.borderRadius
    };
  },
   emojiCategoryWrapper : () => {
    return {
      background:this.style.background || this.theme.palette.getBackground()
    };
  },
   emojiCategoryTitle :() => {
    return {
      font: this.style.textFont || fontHelper(this.theme.typography.caption1),
      color: this.style.textColor || this.theme.palette.getAccent600(),
    };
  },
}
}
