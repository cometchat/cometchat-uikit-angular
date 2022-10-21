import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CometChatTheme, fontHelper } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
import { messageConstants } from '../../../../Shared/Constants/UIKitConstants';
import { styles } from '../../styles';
@Component({
  selector: 'cometchat-delete-bubble',
  templateUrl: './cometchat-delete-bubble.component.html',
  styleUrls: ['./cometchat-delete-bubble.component.scss']
})
export class CometChatDeleteBubbleComponent implements OnInit,OnChanges {
  @Input() text:string = "";
  @Input() style:styles = {
    width:"100%", 
    height:"100%",
    border:"none",
    background:"transparent",
    borderRadius:"0",
    textFont:"400 15px Inter, sans-serif",
    textColor:"rgba(20, 20, 20, 0.33)",
  };	
  @Input() theme: CometChatTheme = new CometChatTheme({});
  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes[messageConstants.TEXT] && changes[messageConstants.TEXT].currentValue != changes[messageConstants.TEXT].previousValue){
      this.text = changes[messageConstants.TEXT].currentValue
    }
  }
  ngOnInit(): void {
  }
  deleteBubbleWrapperStyle(){
    return {
      border: this.style.border,
      borderRadius:this.style.borderRadius,
      background:this.style.background,
      height:this.style.height,
      width:this.style.width
    }
  }
  deleteBubbleTextStyle(){
    return {
      color:this.style.textColor || this.theme.palette.getAccent400(),
      font:this.style.textFont || fontHelper(this.theme.typography.subtitle1)
    }
  }
}
