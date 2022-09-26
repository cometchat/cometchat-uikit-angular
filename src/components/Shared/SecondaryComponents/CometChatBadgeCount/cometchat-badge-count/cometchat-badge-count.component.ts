import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
@Component({
  selector: "cometchat-badge-count",
  templateUrl: "./cometchat-badge-count.component.html",
  styleUrls: ["./cometchat-badge-count.component.scss"],
})
export class CometChatBadgeCountComponent implements OnInit,OnChanges {
  // we will receive this properties from parent component
  @Input() count:number | string = 0; //number of unread messages count
  @Input() width:string = ""; //Width of the avatar in pixels
  @Input() height:string = ""; //Height of the avatar in pixels
  @Input() border:string = "";  //Width of the border in pixels
  @Input()borderRadius :string = ""; //Rounded corners of the border
  @Input() background:string = ")"; //Background Color of the element used for the faallback
  @Input() textColor:string = ""; //Text color of the first letter used for the fallback
  @Input() textFont:string = ""; //It sets all the different properties of an element's font. font-style(optional) font-variant(optional) font-weight(optional) font-size(mandatory) line-height(optional) font-family(mandatory)
  constructor() {}
 
  /**
 * 
 * CometChatBadgeCountComponent is used to show count of unread messages.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
   ngOnChanges(changes: SimpleChanges): void {
     if(changes["count"]){
       if(this.count > 999){
         this.count = "999+"
       }
     }
    
  }

  ngOnInit() {}
  // this object contains dynamic stylings for this component
  badgeCountStyles = {
    getStyle : () => {
      return {
        border: `${this.border}`,
        borderRadius: this.borderRadius,
        background: this.background,
        color: this.textColor,
        font: this.textFont,
        width: this.width,
        height: this.height,
      };
    }
  }
}
