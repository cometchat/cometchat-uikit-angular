import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core"
import { CometChatTheme } from "../../../PrimaryComponents/CometChatTheme/CometChatTheme";
@Component({
  selector: "cometchat-list-item",
  templateUrl: "./cometchat-list-item.component.html",
  styleUrls: ["./cometchat-list-item.component.scss"],
})
export class CometChatListItemComponent implements OnInit, OnChanges {
  @Input() id: string = ""; 
  @Input() text: string = ""; 
  @Input() tail: any 
  @Input() iconURL: string = ""; 
  @Input() onHoverText: string = "";
  @Input() emoji:string = "";
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() style: any = {
    width:"",
    height:"",
    background:"",
    border:"",
    borderRadius:"",
    textFont:"",
    textColor:"",
    iconTint:"",
    iconBackground:"",
    iconBorder:"",
    iconBorderRadius:"",
  } //Styling properties
  @Input() onItemClick!: (menu: object) => object;
  constructor() { }
  /**
* 
* CometChatListItemComponent is used to render a single item.
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
  ngOnInit() {
  }
  ngOnChanges(changes: SimpleChanges) {
  }
  onClick =()=>{
    if(this.onItemClick){
      this.onItemClick({})
    }
  }
  // style object for listitem
  menuItemStyles: any = {
    actionWrapperStyle: () => {
      if (this.style) {
        return {
          WebkitMask: `url(${this.iconURL}) center center no-repeat`,
          background: this.style.iconTint || "grey",
          display: this.style.display || "flex",
          flexDirection: this.style.flexDirection || "row"
        };
      }
      else {
        return
      }
    },
    menuItemStyle: () => {
      if (this.style || this.style.menuStyle) {
        return {
          ...this.style,
        };
      }
      else {
        return
      }
    },
    menuTextStyle: ()=>{
      return {color:this.style.textColor,font:this.style.textFont,marginLeft: !this.iconURL && !this.emoji ? "0px" : "10px"}
    },
    iconStyle:()=>{
      // let style
      // if(this.style.iconBackground && this.style.iconBackground != ''){
      //   style = {
      //     height:"34px",
      //     width:"34px",
      //     marginBottom:"5px"
      //   }
      // }
      return {
        background: this.style.iconBackground || "transparent",
        borderRadius:this.style.borderRadius || "24px",
        // ...style
      }
    }
  }
}
