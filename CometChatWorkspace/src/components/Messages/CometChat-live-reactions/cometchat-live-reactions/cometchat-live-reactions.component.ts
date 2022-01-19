import { Component, Input, OnInit, ElementRef, ViewChild } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-live-reactions",
  templateUrl: "./cometchat-live-reactions.component.html",
  styleUrls: ["./cometchat-live-reactions.component.css"],
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
      transition("normal=>animated", animate(5500)),
    ]),
  ],
})
export class CometChatLiveReactionsComponent implements OnInit {
  @Input() reactionName: string = '';
  counter: any;
  verticalSpeed: any;
  horizontalSpeed: any;
  before: any;
  items: any = [];
  timer: any;
  checkAnimatedState = "normal";

  @ViewChild("emoji", { static: true }) emojiWindow!: ElementRef;

  constructor() {}

  ngOnDestroy() {
    try {
      clearTimeout(this.timer);
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.counter = 0;
      this.verticalSpeed = 5;
      this.horizontalSpeed = 2;
      this.items = [];

      this.before = Date.now();
      const reaction = this.reactionName
        ? enums.LIVE_REACTIONS[this.reactionName]
        : enums.LIVE_REACTIONS.hasOwnProperty(COMETCHAT_CONSTANTS.HEART);

      this.setItems();
      this.requestAnimation();
    } catch (error) {
      logger(error);
    }
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
        ".reactionEmojiStyle"
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
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Function to call animation with Timeout
   */
  requestAnimation() {
    try {
      this.timer = setTimeout(() => {
        this.animate();
      }, 1000 / 60);
    } catch (error) {
      logger(error);
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

      const height = this.emojiWindow.nativeElement.parentElement.offsetHeight;
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
    } catch (error) {
      logger(error);
    }
    return true;
  }
}
