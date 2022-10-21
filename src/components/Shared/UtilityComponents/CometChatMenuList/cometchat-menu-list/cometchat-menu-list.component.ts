import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from "@angular/core";
import { CometChatTheme, fontHelper } from "../../../PrimaryComponents/CometChatTheme/CometChatTheme";
  /**
* 
* CometChatMenuListComponent uses cometchatListItem component to render list of menus and options.
* 
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
@Component({
  selector: "cometchat-menu-list",
  templateUrl: "./cometchat-menu-list.component.html",
  styleUrls: ["./cometchat-menu-list.component.scss"],
})
export class CometChatMenuListComponent implements OnInit, OnChanges {
  @Input() data: any = null;
  @Input() list!: {}[];
  @Input() moreIconURL: string = "assets/resources/moreicon.svg"; //Image URL for more icon
  @Input() mainMenuLimit: number = 2;
  @Input() style: any = {
    width:"",
    height:"",
    border:"",
    borderRadius:"",
    background:"rgb(20, 20, 20)",
    moreIconTint:"",
    textFont:"",
    textColor:"",
    iconTint:"",
    iconBackground:"",
    iconBorder:"",
    iconBorderRadius:"",
  } //CSS properties
  @Input() subMenuStyle: any = {
    width:"100%",
    height:"100%",
    border:"none",
    borderRadius:"12px",
    background:"rgb(20, 20, 20)",
    textFont:"",
    textColor:"",
    iconTint:"",
    iconBackground:"",
    iconBorder:"",
    iconBorderRadius:"",
  }
  @Input() isOpen: boolean = false;
  @Input() theme: CometChatTheme = new CometChatTheme({});
  mainMenuList: any[] = [];
  subMenuList: any[] = [];
  isShown: boolean = false; // hidden by default
  public menuStyle:any={
  }
  constructor(private ref:ChangeDetectorRef) { };

  ngOnInit() {

    this.menuStyle= {
      width:this.style.width || "100%",
      height:this.style.height ||  "100%",
      background:this.style.background || "transparent",
      textFont:this.style.textFont || fontHelper(this.theme.typography.subtitle1),
      textColor: this.style.textColor || this.theme.palette.getAccent600(),
      borderRadius:this.style.borderRadius || "8px",
      iconTint: this.style.iconTint ||  this.theme.palette.getAccent600(),
      iconBackground: this.style.iconBackground || "transparent"
 }
    this.mainMenuList = this.mainMenuItems();
    this.subMenuList = this.subMenuItems();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (!this.isOpen) {
      this.isShown = false
    }
  }
  /**
   * trigger callback on click of item.
   * @param  {any} item
   * @param  {any} e
   */
  onMenuItemClick(item: any, e: any) {
    this.isOpen = false
    this.isShown = false
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    if (this.data) {
      item.callBack(this.data, e)
    }
    else {
      item.callBack()
    }
  }
  /**
   * hide show submenu on click of more icon
   * @param  {any} e
   */
  toggleShow(e: any) {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
    this.isShown = !this.isShown;
    this.ref.detectChanges()
  }
  // filtering main menu options from list 
  mainMenuItems() {
    const defaultNumber = this.mainMenuLimit - 1;
    return this.list?.filter((item: any, i: any) => {
      return i <= defaultNumber
    })
  }
  // filtering submenu options from list
  subMenuItems() {
    const defaultNumber = this.mainMenuLimit - 1;
    return this.list?.filter((item: any, i: any) => {
      return i > defaultNumber
    })
  }
  // submenu style
  subMenuStyles() {
    return {
      ...this.subMenuStyle,
    }
  }
  // mainmenu style
  mainMenuStyles() {
    return {
      background:this.style?.background,
     borderRadius:this.style?.borderRadius,
     border:this.style.border
    }
  }
}
