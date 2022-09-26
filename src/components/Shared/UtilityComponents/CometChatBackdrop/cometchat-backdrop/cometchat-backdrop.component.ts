import { Component, Input, OnInit } from "@angular/core";
import * as types from "../../../Types/typesDeclairation";
@Component({
  selector: "cometchat-backdrop",
  templateUrl: "./cometchat-backdrop.component.html",
  styleUrls: ["./cometchat-backdrop.component.scss"],
})
export class CometChatBackdropComponent implements OnInit {
  @Input() isOpen: boolean = false; //If `true`, the component is shown
  @Input() onClick!: types.callBack //Callback function when clicked 
  @Input () children!:any;   //The content of the component
  @Input() style: any = {
    height:"100%",
    width:"100%",
    border:"none",
    borderRadius:"none",
    backgroundColor:"#000"
  } //Styles applied to the backdrop element
  constructor() { }
  /**
* 
* CometChatBackDropComponent is used to add dark background on components.
* 
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
  ngOnInit() { }
  clickHandler = ()=>{
    if(this.onClick){
      this.onClick()
    }

  }
  backDropStyle() {
    return {
      ...this.style
    }
  }
}
