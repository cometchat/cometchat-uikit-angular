import { Component, OnInit, Input,  ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { BaseStyle,  MessageBubbleAlignment } from 'uikit-utils-lerna';
import {MenuListStyle} from 'my-cstom-package-lit'
import { CometChatThemeService } from '../../CometChatTheme.service';
import { CometChatMessageOption, CometChatTheme } from 'uikit-resources-lerna';
@Component({
  selector: 'cometchat-message-bubble',
  templateUrl: './cometchat-message-bubble.component.html',
  styleUrls: ['./cometchat-message-bubble.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CometChatMessageBubbleComponent implements OnInit,OnChanges {
  @Input() messageBubbleStyle: BaseStyle = {
    width: "100%",
    height: "auto",
    background: "",
    borderRadius: "12px",
    border:"none"
  };
  @Input() alignment:MessageBubbleAlignment  = MessageBubbleAlignment.right;
  @Input() options:CometChatMessageOption[] = [];
  @Input() id:number | string | undefined = undefined;
  @Input() leadingView!: TemplateRef<any> | null;
  @Input() headerView!: TemplateRef<any> | null;
  @Input() replyView!: TemplateRef<any> | null;
  @Input() contentView!: TemplateRef<any> | null;
  @Input() threadView!: TemplateRef<any> | null;
  @Input() footerView!: TemplateRef<any> | null;
  @Input() bottomView!: TemplateRef<any> | null;
   optionsStyle:MenuListStyle = {
    width: "",
    height: "",
    border: "1px solid #e8e8e8",
    borderRadius: "8px",
    submenuWidth: "100%",
    submenuHeight: "100%",
    submenuBorder: "1px solid #e8e8e8",
    submenuBorderRadius: "8px",
    moreIconTint:"grey"
  }
  @Input() moreIconURL: string = "assets/moreicon.svg";
  @Input() topMenuSize: number = 3;
  public theme:CometChatTheme =new CometChatTheme({})
  public uikitConstant: typeof MessageBubbleAlignment =  MessageBubbleAlignment;
  public isHovering:boolean = false;
  constructor(private ref: ChangeDetectorRef,private themeService:CometChatThemeService) { }
  ngOnChanges(changes: SimpleChanges): void {
  }
  ngOnInit(): void {
    this.optionsStyle = new MenuListStyle({
      border:`1px solid ${this.themeService.theme.palette.getAccent200()}`,
      borderRadius: "8px",
      background: this.themeService.theme.palette.getBackground(),
      submenuWidth: "100%",
      submenuHeight: "100%",
      submenuBorder: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
      submenuBorderRadius: "8px",
      submenuBackground: this.themeService.theme.palette.getBackground(),
      moreIconTint:this.themeService.theme.palette.getAccent()
    })
  }
  /**
   * hide show menu options on hover
   * @param  {MouseEvent} event?
   */
   hideShowMenuOption(event?: MouseEvent) {
    this.isHovering = event?.type === "mouseenter";
    this.ref.detectChanges()
  }
  /**
   * @param  {any} event
   */
   onOptionClick(event: any) {
    const onClick = event?.detail?.data?.onClick;
    if (onClick) {
      onClick(this.id,event?.detail?.event);
    }
  }
  wrapperStyle = () => {
    switch (this.alignment) {
      case MessageBubbleAlignment.right:
        return {
          display: "flex",
          justifyContent: "flex-end"
        };
      case MessageBubbleAlignment.left:
        return {
          display: "flex",
          justifyContent: "flex-start"
        };
      case MessageBubbleAlignment.center:
        return {
          display: "flex",
          justifyContent: "center"
        };
      default:
        return {
          display: "flex",
          justifyContent: "center"
        };
    }
  };
  bubbleStyle = ()=>{
    return {
      ...this.messageBubbleStyle,
      display:"flex",
      flexDirection:"column",
      alignItems: "flex-start"
    }
  }
  bubbleAlignmentStyle():any{
    return {
      display:"flex",
      justifyContent:"flex-start",
      alignItems:this.alignment == MessageBubbleAlignment.left? "flex-start" : "flex-end",
    }
  }
  optionsStyles:any = ()  =>{
    return {
      justifyContent: this.alignment == MessageBubbleAlignment.left ? "flex-start" : "flex-end",
      top: this.headerView && this.alignment == MessageBubbleAlignment.left ? "-4px" : "-24px",
      background:this.themeService.theme.palette.getBackground()
    }
  }
  titleStyle(){
    return{
      display:"flex",
      justifyContent: this.alignment == MessageBubbleAlignment.left ? "flex-start" : "flex-end",
      alignItems:"flex-start"
    }
  }
}