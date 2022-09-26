import { Component, OnInit, Input, ElementRef, ViewChild, OnChanges, SimpleChanges, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { messageConstants } from '../../../Shared/Constants/UIKitConstants';
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service';
  /**
*
* CometChatLiveReaction is used to send live reaction in group or 1v1 chat
*
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
*
*/
@Component({
  selector: 'cometchat-live-reactions',
  templateUrl: './cometchat-live-reactions.component.html',
  styleUrls: ['./cometchat-live-reactions.component.scss'],
  animations: [
    trigger("FadeInFadeOut", [
      state(
        "normal",
        style({
          opacity: "1",
        })
      ),
      state(
        "animated",
        style({
          opacity: "0",
          transition: "opacity 5s",
        })
      ),
      transition("normal=>animated", animate(messageConstants.animate)),
    ]),
  ],
})
export class CometChatLiveReactionsComponent implements OnInit,AfterViewInit {
        /**
   * This properties will come from Parent.
   */
  @Input() reactionName: string = 'assets/resources/heart-reaction.png';
  @Input() style = {
    width: "25px",
    height: "20px",
    background: "transparent"
  };
     /**
     * Properties for internal use
     */
  public Array = Array
  counter: any;
  verticalSpeed: any;
  horizontalSpeed: any;
  before: any;
  items: any = [];
  timer: any;
  checkAnimatedState = "normal";
  @ViewChild("emoji") emojiWindow!: ElementRef;
  constructor(private messageEvents:CometChatMessageEvents) {
  }
  ngAfterViewInit(): void {
       try {

      this.counter = 0;
      this.verticalSpeed = 5;
      this.horizontalSpeed = 2;
      this.items = [];
      this.before = Date.now();
      this.setItems();
      this.requestAnimation();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
   
  }
  ngOnInit() {
 
  }

  /**
   * Sets height width speed for animation
   */
  setItems() {
    try {
      //Toggle animation state
      this.checkAnimatedState == "normal"
        ? (this.checkAnimatedState = "animated")
        : (this.checkAnimatedState = "normal");
      const width = this.emojiWindow.nativeElement.parentElement.offsetWidth;
      const height = this.emojiWindow.nativeElement.parentElement.offsetHeight;
      const elements = this.emojiWindow.nativeElement.parentElement.querySelectorAll(
        ".reaction__emoji"
      );
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i],
          elementWidth = element.offsetWidth,
          elementHeight = element.offsetHeight;
        const item = {
          element: element,
          elementHeight: elementHeight,
          elementWidth: elementWidth,
          ySpeed: -this.verticalSpeed,
          omega: (2 * Math.PI * this.horizontalSpeed) / (width * 60), //omega= 2Pi*frequency
          random: (Math.random() / 2 + 0.5) * i * 10000, //random time offset
          x: function (time: number) {
            return (
              ((Math.sin(this.omega * (time + this.random)) + 1) / 2) *
              (width - elementWidth)
            );
          },
          y: height + (Math.random() + 0.2) * i * elementHeight,
        };
        this.items.push(item);
      }
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  requestAnimation() {
    try {
      this.timer = setTimeout(() => {
        this.animate();
      }, 1000 / 60);
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
  }
  /**
   * Animates the reactions
   */
  animate(): boolean {
    try {
      if (!this.emojiWindow.nativeElement.parentElement) {
        return false;
      }
      const time = +new Date(); //little trick, gives unix time in ms
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        const transformString =
          "translate3d(" + item.x(time) + "px, " + item.y + "px, 0px)";
        item.element.style.transform = transformString;
        item.element.style.visibility = "visible";
        item.y += item.ySpeed;
      }
      this.requestAnimation();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);;
    }
    return true;
  }
   /**
   * Props dependent styles for the CometChatLiveReaction.
   *
   */
  liveReactionStyle = () => {
    return {
      ...this.style
    }
  }
}
