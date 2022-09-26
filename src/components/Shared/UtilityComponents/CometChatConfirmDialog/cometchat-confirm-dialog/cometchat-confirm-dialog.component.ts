import { Component, Input, OnInit } from '@angular/core';
import { localize } from '../../../PrimaryComponents/CometChatLocalize/cometchat-localize';
import * as types from '../../../Types/typesDeclairation';
import { confirmDialogStyle } from '../interface';
import { states } from '../../../Constants/UIKitConstants';
  /**
* 
* CometChatConfirmDialogComponent is used to show alert for actions performed by users.
* 
* 
* @version 1.0.0
* @author CometChatTeam
* @copyright © 2022 CometChat Inc.
* 
*/
@Component({
  selector: 'cometchat-confirm-dialog',
  templateUrl: './cometchat-confirm-dialog.component.html',
  styleUrls: ['./cometchat-confirm-dialog.component.scss']
})
export class CometChatConfirmDialogComponent implements OnInit {
  // input properties
  @Input() isOpen: boolean = false //boolean value that indicates if the dialog is open or closed
  @Input() title: string = localize("DELETE_CONVERSATION") //The dialog's title. Passing nullor empty string will hide the title.
  @Input() messageText: string = "Would you like to delete this conversation?  This conversation will be deleted from all of your devices." //The message that appears below the dialog's title
  @Input() confirmButtonText: string = localize("DELETE") //Confirm button label
  @Input() cancelButtonText: string = localize("CANCEL") //Cancel button label
  @Input() onConfirm!: types.callBack; //Callback function when confirm button is clicked
  @Input() onCancel!: types.callBack;  //Callback function when cancel button is clicked
  @Input() message: string = localize("DELETE_CONVERSATION");
  @Input() style: confirmDialogStyle = {
    height:"100%",
    width:"100%",
    background:"white",
    borderRadius:"8px",
    border:"none"

  } //styling style
 
  public state: string = states.initial;
  public stateConstant:typeof states = states
   public loadingIconURL: string = "assets/resources/Spinner.svg";
  constructor() { }

  ngOnInit() {
  }
  onClick = ()=>{
    this.state = states.loading
    if(this.onConfirm){
      this.onConfirm().then((res:any)=>{
       this.state = states.success;
      })
      .catch((err:any)=>{
        this.state = states.error;
      })
    }
  }
  onClose = ()=>{
    if(this.onCancel){
      this.onCancel()
    }
  }
  /**
   * loading icon wrapper style
   * @param  {string} state
   */
  dialogLoadingWrapperStyle = () => {
    const display = this.state === states.loading ? { display: "flex" } : { display: "none" };
    return {
      ...display,
      ...this.style
    };
  };

  dialogLoadingStyle = () => {
    return {
      background: `url(${this.loadingIconURL}) center center`,
      width: "24px",
      height: "24px",
    };
  };
  dialogWrapperStyle = () => {
    return {
      height:this.style.height,
      width:this.style.width,
      background: this.style.background,
      border: this.style.border,
      borderRadius: this.style.borderRadius,
    };
  };

  dialogFormStyle = () => {
    const display = (this.state === states.initial || this.state === states.success) ? { display: "flex" } : { display: "none" };
    return {
      ...display,
    }
  }
  // title message style
  dialogTitleStyle() {
    return {
      font: this.style.titleFont,
      color: this.style.titleColor,
    }
  }

  /**
   * error message
   * @param  {string} state
   */
  dialogErrorStyle = () => {
    const display = (this.state === states.error) ? { display: "block" } : { display: "none" };
    return {
      font: "11px Inter",
      color: "red",
      textAlign: "center",
      ...display,
    };
  }
  // subtitle styles
  dialogMessageStyle = () => {
    return {
      textAlign: "center",
      lineHeight: "1.6",
      font: this.style.subtitleFont,
      letterSpacing: "-0.1",
      color: this.style.subtitleColor,
    };
  };
  buttonConfirmStyle = () => {
    return {
      font: this.style.confirmTextFont,
      background: this.style.confirmBackground,
      color: this.style.confirmTextColor,
    };
  };
  buttonCancelStyle = () => {
    return {
      color: this.style.cancelTextColor,
      font: this.style.cancelTextFont,
      background: this.style.cancelBackground,
    };
  }
}
