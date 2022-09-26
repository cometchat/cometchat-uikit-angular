import { Component, OnInit, Input } from '@angular/core';
import { CometChatTheme, fontHelper, localize } from '../../../PrimaryComponents';
import { CometChatWrapperComponent } from '../../../PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.component';
import { actionSheetItemStyle, actionSheetStyles } from '../interface';
/**
*
* CometChatActionSheet is used to show multiple message types using CometChatListItem component.
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-action-sheet',
  templateUrl: './cometchat-action-sheet.component.html',
  styleUrls: ['./cometchat-action-sheet.component.scss']
})
export class CometChatActionSheetComponent implements OnInit {
  @Input() hideLayoutMode:boolean= false;
  @Input() title:string = localize("ADD_TO_CHAT");
  @Input() layoutModeIconURL:string= "assets/resources/Grid-layout.svg";
  @Input() style:actionSheetStyles = {
    layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
    borderRadius: "8px",
    background: "rgb(255,255,255)",
    border: "none",
    width: "100%",
    height: "100%",
    titleFont: "500 15px Inter, sans-serif",
    titleColor: "#141414",
    listItemIconTint:"rgba(20, 20, 20, 0.69)",
    listItemTitleFont:"500 15px Inter, sans-serif",
    listItemTitleColor:"rgba(20, 20, 20, 0.69)",
    listItemIconBackground:"transparent",
    listItemIconBorderRadius:"none",
    
  };
  public theme:any = new CometChatTheme({});
  public layoutType:{list:string,grid:string} = Object.freeze({
    list: "list",
    grid: "grid"
  });
  public actionSheetItemStyle:actionSheetItemStyle = {
    height:"54px",
    // iconBackground:"#6929CA",
    iconTint:"rgba(20, 20, 20, 0.69)",
    textFont:fontHelper(this.theme.typography.subtitle1)
  }
  toggleButtonStyle:actionSheetItemStyle = {
    // iconBackground:this.theme.palette.getPrimary(),
    iconTint:"rgb(51, 153, 255)",
    borderRadius:"24px"
  }
  public localize:typeof localize = localize
  @Input() layoutMode:string= this.layoutType.list;
  @Input() actions:any= []; 
  constructor() { }
  ngOnInit(): void {
  }
  onActionItemClick(){
  }
  toggleLayoutMode() {

    if(this.layoutMode == this.layoutType.list){
      this.layoutMode = this.layoutType.grid;
      this.actionSheetItemStyle.height = "84px"
      this.actionSheetItemStyle.display = "flex"
      this.actionSheetItemStyle.flexDirection = "column"
      this.actionSheetItemStyle.justifyContent = "center"
      this.actionSheetItemStyle.width = "115px"
      this.actionSheetItemStyle.textFont = fontHelper(this.theme.typography.caption1)
    }
    else{
      this.layoutMode = this.layoutType.list;
      this.actionSheetItemStyle.height = "54px"
      this.actionSheetItemStyle.width = "100%"
      this.actionSheetItemStyle.display = "flex"
      this.actionSheetItemStyle.flexDirection = "row"
      this.actionSheetItemStyle.justifyContent = "flex-start"
      this.actionSheetItemStyle.textFont = fontHelper(this.theme.typography.subtitle1)
    }
    }
  /**
   * Props dependent styles for the CometChatActionSheet.
   *
   */
  styles:any={
    actionSheetTitleStyle :()=> {
      return {
        color: this.style.titleColor,
        font: this.style.titleFont,
      };
    },
     actionSheetLayoutIconStyle :()=> {
      return {
        WebkitMask: `url(${this.layoutModeIconURL})`,
        background:  this.toggleButtonStyle.iconTint,
      };
    },
     sheetItemListStyle :()=> {
      let flexDirection = { flexDirection: "row" };
      let  flexWrap = { flexWrap: "wrap" };
      if (this.layoutMode === this.layoutType.list) {
        flexDirection = { flexDirection: "column" };
        flexWrap = { flexWrap: "nowrap" };
      }
      return {
        ...flexDirection,
        ...flexWrap,
      };
    },
    layoutModeStyle:()=>{
      return {
        background: this.theme.palette.getAccent50(),
        width: this.layoutMode == this.layoutType.list ? "100%" : "fit-content",
        borderBottom:`1px solid ${this.theme.palette.getAccent50()}`,
        margin:this.layoutMode == this.layoutType.grid ? "2px":"0"
      }
    },
    layoutIconStyle:()=>{
      return{
        background:this.toggleButtonStyle.iconBackground,
      }
    },
    actionSheetWrapperStyle : () => {

      return {
        ...this.style,
      }
    }
  };
}
