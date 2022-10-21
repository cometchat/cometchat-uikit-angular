import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core"
import { localize, CometChatLocalize } from "../../../PrimaryComponents/CometChatLocalize/cometchat-localize";
import { styles } from "../interface";
  /**
* 
* CometChatListBase is a wrapper component whichh takes a component and add title , search options or other features accordingly.
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
@Component({
  selector: "cometchat-list-base",
  templateUrl: "./cometchat-list-base.component.html",
  styleUrls: ["./cometchat-list-base.component.scss"],
})
export class CometChatListBaseComponent implements OnInit, OnChanges {
  // we receive this properties from parent component.
  @Input() title: string = ""; // Title of the component
  @Input() searchPlaceHolder: string = localize("SEARCH") //  placeholder text of search input
  @Input() onSearch: Function = () => { } //method invoked upon entering text into search input
  @Input() style: styles = {
    width: "",
    height: "",
    border: "",
    borderRadius: "",
    background: "",
    titleFont: "",
    titleColor: "",
    backIconTint: "",
    searchBorder: "",
    searchBorderRadius: "",
    searchBackground: "",
    searchTextFont: "",
    searchTextColor: "",
    startConversationIconTint: "",
    searchIconTint: "",
  }; //consists of all styling properties
  @Input() backButtonIconURL: string = ""; //image URL of the back button to be rendered
  @Input() searchIconURL: string = "" //image URL of the search icon to be rendered
  @Input() showBackButton: boolean = true; //switch on/off back button
  @Input() hideSearch: boolean = true; // switch on/ff search input
  public localize = localize
  constructor() { }

  ngOnInit() {

  }
  ngOnChanges(change: SimpleChanges) {
  }
  listBaseStyles = {
    listBaseStyle: () => {
      return {
        width: this.style.width,
        height: this.style.height,
        background: this.style.background,
        borderRadius: this.style.borderRadius,
        marginTop: this.hideSearch ? "0px" : "0px"
        // border: this.border,
      };
    },
    listBaseHeadStyle: () => {
      return {
        height: this.hideSearch ? "55px" : "92px",
      };
    },
    backButtonStyle: () => {
      return {
        webkitMask: `url(${this.backButtonIconURL}) no-repeat left center`,
        background: `${this.style['backIconTint']}`,
      };
    },
    listBaseTitleStyle: () => {
      let marginLeft = this.showBackButton ? {
        marginLeft: "0"
      } : { marginLeft: "8px" }
      return {
        font: this.style.titleFont,
        color: this.style.titleColor,
        ...marginLeft
      };
    },
    listBaseSearchStyle: () => {

      return {
        borderRadius: this.style["searchBorderRadius"],
        boxShadow: `${this.style["searchBackground"]} 0 0 0 1px inset`,
        background: this.style["searchBackground"],

      };
    },
    listBaseSearchButtonStyle: () => {
      return {
        webkitMask: `url(${this.searchIconURL}) center center no-repeat`,
        background: `${this.style["searchIconTint"]}`,
      };
    },
    listBaseSearchInputStyle: () => {
      return {
        height: "100%",
        font: this.style["searchTextFont"],
        color: this.style["searchTextColor"],
        background: this.style["searchBackground"],
        border: this.style["searchBorder"],
        padding:"8px"
      };
    },
    listBaseContainerStyle: () => {
      const height = !this.hideSearch
        ? {
          height: "calc(100% - 101px)",
        }
        : {
          height: "calc(100% - 50px)",
        };
      return {
        background: "transparent",
        width: "100%",
        ...height,
      };
    },
  }
  /**
   * this function triggers onSearc callback when we search.
   * @param  {string} keyword
   */
  searchKeyword(keyword:string){
    this.onSearch(keyword)
    
  }
}
