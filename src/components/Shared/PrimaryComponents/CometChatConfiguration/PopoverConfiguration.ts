import { popoverStyles } from "../../UtilityComponents/CometChatPopover/interface";

/**
 * @class PopoverConfiguration
 * @param {object} style
 * @param {strnumbering} withBackdrop
 * @param {string} position

 */
 export class PopoverConfiguration {

    style!:popoverStyles;
      withBackdrop:boolean=false;
       position:string= "top";
    constructor({
        style = {
            width:"272px",
            height:"330px",
            border:"none",
            background:"white",
            borderRadius:"12px", 
            boxShadow: "0px 0px 32px rgba(20, 20, 20, 0.2)",
            top:"50%",
            left:"50%",
            transform:"translate(-50%,-50%)",
            position:"fixed",
          } ,
        withBackdrop = true,
        position= "top"

    }) {
        this.style = style;
        this.withBackdrop = withBackdrop;
        this.position=position;

    }
}