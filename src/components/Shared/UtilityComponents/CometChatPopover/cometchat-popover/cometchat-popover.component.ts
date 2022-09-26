import { Component, OnInit, Input } from '@angular/core';
import { CometChatTheme } from '../../../PrimaryComponents/CometChatTheme/CometChatTheme';
import { popoverStyles } from '../interface';
@Component({
  selector: 'cometchat-popover',
  templateUrl: './cometchat-popover.component.html',
  styleUrls: ['./cometchat-popover.component.scss']
})
export class CometChatPopoverComponent implements OnInit {
@Input() style:popoverStyles = {
    width:"272px",
    height:"330px",
    border:"none",
    background:"white",
    borderRadius:"8px", 
    boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
    top:"unset",
    left:"unset",
    transform:"none",
    position:"fixed",
  } 
  @Input() withBackdrop:boolean=false;
   @Input() position:string= "top";
   @Input() x:number= 0;
   @Input() y:number= 0;
   public theme:any =  new CometChatTheme({});
  constructor() { }
/**
 * 
 * CometChatToolTipComponent is used to add tooltip container around other components.
 * 
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
  ngOnInit(): void {

  }
 public deg:any = {
  top: 180,
  right: 270,
  bottom: 0,
  left: 90
};
 public positions:any = {
  top: "top",
  left: "left",
  bottom: "bottom",
  right: "right"
};
 public tipPositionMapping:any = {
  top: "x",
  bottom: "x",
  left: "y",
  right: "y"
};
  /**
   * Props dependent styles for the CometChatToolTip.
   *
   */
  styles:any={
    toolTipWrapperStyle : () => {
      const axis = this.tipPositionMapping[this.position];
      var x:any = this?.x ? this.x : "0";
      var y:any = this?.y ? this.y : "0";
      var width:any = parseInt(this.style.width!);
      var height:any = parseInt(this.style.height!);
      var windowWidth:any = window.innerWidth;
      var windowHeight:any = window.innerHeight;
      var percent:any = 0;
      if (axis === "x") {
        percent = (100 * x) / windowWidth;
      } else {
        percent = (100 * y) / windowHeight;
      }
      let axisPosition = {};
      if (axis === "x") {
        axisPosition = {
          left: `${x - width * (percent / 100)}px`
        };
      } else {
        axisPosition = {
          top: `${y - height * (percent / 100)}px`
        };
      }
      let positionStyle = {};
      if (this.position === this.positions.top) {
        positionStyle = {
          top: `${y - parseInt(height) - 20}px`
        };
      } else if (this.position === this.positions.bottom) {
        positionStyle = {
          top: `${y + 20}px`
        };
      } else if (this.position === this.positions.left) {
        positionStyle = {
          left: `${x - parseInt(width) - 30}px`
        };
      } else if (this.position === this.positions.right) {
        positionStyle = {
          left: `${x + 25}px`
        };
      }
      let styles:any;
      if(this.x || this.y){
        styles = {
          boxShadow: this.style.boxShadow,
          borderRadius: this.style.borderRadius,
          zIndex: 100,
          width: `${width}px`,
          height: `${height}px`,
          position: "fixed",
          background: `${this.style.background || this.theme?.palette?.getAccent900()}`,
          ...positionStyle,
          ...axisPosition,
        }
      }
      else{
        styles = {
          height:this.style.height,
          width:this.style.width,
          top:this.style.top,
          left:this.style.left,
          transform:this.style.transform,
          position:this.style.position,
          background: `${this.style.background || this.theme?.palette?.getAccent900()}`,
          boxShadow: this.style.boxShadow,
          borderRadius: this.style.borderRadius,
          zIndex: 100,
        }
      }
       return styles;
    
    },
     toolTipStyles : () => {
      const axis = this.tipPositionMapping[this.position];
      let x:any = this?.x ? this.x : "0";
      let y:any = this?.y ? this.y : "0";
      let width:any = parseInt(this.style.width!);
      let height :any= parseInt(this.style.height!);
      let windowWidth:any = window.innerWidth;
      let windowHeight:any = window.innerHeight;
      let percent:any = 0;
      if (axis === "x") {
        percent = (100 * x) / windowWidth;
      } else {
        percent = (100 * y) / windowHeight;
      }
      let positionStyle = {};
      if (axis === "x") {
        if (this.position === this.positions.top) {
          positionStyle = {
            left: `${width * (percent / 100) - 10}px`,
            top: height
          };
        } else if (this.position === this.positions.bottom) {
          positionStyle = {
            left: `${width * (percent / 100) - 10}px`,
            top: -10
          };
        }
      } else {
        if (this.position === this.positions.left) {
          positionStyle = {
            left: `calc(${width} - 5px)`,
            top: `${height * (percent / 100) - 10}px`
          };
        } else if (this.position === this.positions.right) {
          positionStyle = {
            left: -15,
            top: `${height * (percent / 100) - 10}px`
          };
        }
      }
      return {
        zIndex: 11,
        borderBottom: `10px solid ${this.style.background || this.theme?.palette?.getAccent900()}`,  
        ...positionStyle,
        transform: `rotate(${this.deg[this.position]}deg)`
      };
    },
  }
}
