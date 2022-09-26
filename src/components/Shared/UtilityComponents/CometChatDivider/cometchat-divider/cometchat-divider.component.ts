import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'cometchat-divider',
  templateUrl: './cometchat-divider.component.html',
  styleUrls: ['./cometchat-divider.component.scss']
})
export class CometChatDividerComponent implements OnInit {

  @Input() style = {
    height: "",
	  background: ""
  }; //Styles applied to the divider element

  constructor() { }

/**
 * 
 * CometChatDividerComponent is used to add horizontal divider in components.
 * 
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */

  ngOnInit(): void {
  }

  dividerStyle = {
    horizontalLineStyle: () => {
      return {
        height: this.style.height,
        background: this.style.background,
      }
    }
  }

}
