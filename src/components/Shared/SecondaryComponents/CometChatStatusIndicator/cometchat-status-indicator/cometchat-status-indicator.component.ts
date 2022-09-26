import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
@Component({
  selector: "cometchat-status-indicator",
  templateUrl: "./cometchat-status-indicator.component.html",
  styleUrls: ["./cometchat-status-indicator.component.scss"],
})
export class CometChatStatusIndicatorComponent implements OnInit, OnChanges {
  // we will receive this properties from parent component
  @Input() width: string = ""; //Width of the indicator dot in pixels
  @Input() height: string = ""; //Height of the indicator dot in pixels
  @Input() border: string = ""; //This property sets an element's border. It sets the values of border-width, border-style, and border-color.
  @Input()borderRadius: string = ""; //Rounded corners of the element.
  @Input() backgroundColor: string = ""; //Background color for the component.
  @Input() backgroundImage: string | null = ""; //Background image for the component.
  public background:string = "";
  @Input() style!: object; //Custom styling
  constructor() { }
  /**
 * 
 * CometChatStatusIndicatorComponent is used to show user onliune and offline presence.
 *  
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
  ngOnChanges(change:SimpleChanges) {
    this.background = ""
    if (this.backgroundImage) {

      this.background = `${this.backgroundColor} url(${this.backgroundImage}) no-repeat  center`;
    }
    else if(this.backgroundColor && !this.backgroundImage){
      this.background = this.backgroundColor
    }
 

  }
  ngOnInit() {
  }
  // this object contains dynamic stylings for this component
  statusIndicatorStyles = {
    getStyle: () => {
      return {
        border: `${this.border}`,
        borderRadius: this.borderRadius,
        background: this.background,
        height: this.height,
        width: this.width,
        ...this.style
      };
    }
  }
}
