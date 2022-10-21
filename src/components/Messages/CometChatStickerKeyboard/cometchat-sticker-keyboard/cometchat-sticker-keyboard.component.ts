import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { checkHasOwnProperty } from '../../../Shared/Helpers/CometChatHelper';
import { CometChat } from '@cometchat-pro/chat';
import { ExtensionURLs, stickerEnums } from '../../../Shared/Constants/UIKitConstants';;
import { stickerKeyboardStyle } from '../interface';
import { CometChatMessageEvents } from '../../CometChatMessageEvents.service';
import { CometChatTheme, fontHelper } from '../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
  /**
   *
   * CometChatStickerKeyboard Provides ability to share stickers in a 1:1 and group chats.
   * 
   */
@Component({
  selector: 'cometchat-sticker-keyboard',
  templateUrl: './cometchat-sticker-keyboard.component.html',
  styleUrls: ['./cometchat-sticker-keyboard.component.scss']
})
export class CometChatStickerKeyboardComponent implements OnInit {
          /**
   * This properties will come from Parent.
   */
  @Input() style: stickerKeyboardStyle = {
    width: "100%",
    height: "auto",
    border: "none",
    borderRadius: "8px",
    background: "rgb(245, 245, 245)",
    categoryBackground: "rgb(255,255,255)",
    emptyTextFont:"500 15px Inter,sans-serif",
    emptyTextColor:"rgba(20,20,20, 0.58)",
    errorTextFont:"500 15px Inter,sans-serif",
    errorTextColor:"rgba(20,20,20, 0.58)",
    loadingTextFont:"500 15px Inter,sans-serif",
    loadingTextColor:"rgba(20,20,20, 0.58)",
  }
  @Input() theme: CometChatTheme = new CometChatTheme({});
  @Input() emptyText: string = stickerEnums.no_stickers_found;
  @Input() loadingText: string = stickerEnums.loading_message;
  @Input() errorText: string = "Something went wrong";
  @Input() onClick!: (sticker: object) => void;
       /**
     * Properties for internal use
     */
  public decoratorMessage: string = "";
  public loading: boolean = true;
  public stickerList: object[] = [];
  public stickerSet: any = {};
  public activeStickerList: any[] = [];
  public activeStickerSet: any;
  public categoryStickerUrl: any[] = [];
  public isEmpty:boolean=false;
  public isError:boolean=false;

  constructor(private ref:ChangeDetectorRef, private messageEvents:CometChatMessageEvents) { }
  ngOnInit(): void {
   
    this.decoratorMessage = this.loadingText
    try {
      this.getStickers();
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
   /**
   * fetching stickers on init
   * @param
   */
  async getStickers() {
    this.isEmpty = false
    this.isError = false
    this.loading = true;
    try {
     const stickers:any = await CometChat.callExtension(stickerEnums.stickers, "GET", ExtensionURLs.stickers, undefined)

     let activeStickerSet = null;
     const customStickers = [];
     
     checkHasOwnProperty
     if (checkHasOwnProperty(stickers, stickerEnums.custom_stickers)) {
       
       customStickers.push(stickers[stickerEnums.custom_stickers]);
     }
     const defaultStickers = checkHasOwnProperty(
       stickers, stickerEnums.default_stickers
     )
       ? stickers[stickerEnums.default_stickers]
       : [];
     defaultStickers.sort(function (a: any, b: any) {
       return a.stickerSetOrder - b.stickerSetOrder;
     });
     customStickers.sort(function (a: any, b: any) {
       return a.stickerSetOrder - b.stickerSetOrder;
     });
     const stickerList = [...defaultStickers, ...customStickers];

     if (stickerList.length === 0) {
       this.isEmpty = true
       this.isError = false
       this.loading = false
       this.decoratorMessage = this.emptyText;
     }
     const stickerSet = stickerList.reduce((r, sticker, index) => {
       const { stickerSetName } = sticker;
       if (index === 0) {
         activeStickerSet = stickerSetName;
       }
       r[stickerSetName] = [...(r[stickerSetName] || []), { ...sticker }];
       return r;
     }, {});
     let activeStickerList = [];
     if (Object.keys(stickerSet).length) {
       Object.keys(stickerSet).forEach((key) => {
         stickerSet[key].sort(function (a: any, b: any) {
           return a.stickerOrder - b.stickerOrder;
         });
       });
       if (activeStickerSet !== null) {
         activeStickerList = stickerSet[activeStickerSet];
       }
     }
     this.stickerList = stickerList;
     this.stickerSet = stickerSet;
     this.activeStickerList = activeStickerList;
     this.activeStickerSet = activeStickerSet;
     if (stickerList.length !== 0) {
       this.loading = false;
     }
     Object.keys(this.stickerSet).map((sectionItem) => {
       const url = this.stickerSet[sectionItem][0];
       this.categoryStickerUrl.push(url);
     });
        
    } catch (error:any) {
      this.isEmpty = false
      this.isError = true
      this.loading = false

      
      this.decoratorMessage = this.errorText;
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
    this.ref.detectChanges()
  }
  /**
   * Gets The sticker collection when sticker category is changed
   * @param
   */
  stickerSetClicked(sectionItem: any) {
    try {
      this.activeStickerList = [];
      const stickerSet: any = { ...this.stickerSet };
      const activeStickerList = stickerSet[sectionItem];
      this.activeStickerSet = sectionItem;
      this.activeStickerList = activeStickerList;
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**
   * Sends Sticker as Message
   * @param
   */
  sendStickerMessage(stickerItem: any) {

    try {
      this.onClick(stickerItem)
    } catch (error:any) {
        this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
/**
   * Props dependent styles for the CometChatStickersKeyboard.
   *
   */
  styles: any = {
    decorateMessageStyles: () => {
      let style;
      if(this.loading){

        style = {
          color: this.style.loadingTextColor || this.theme.palette.getAccent600(),
          font: this.style.loadingTextFont || fontHelper(this.theme.typography.title1),

        }

      }
      else if(this.isError){
        style = {
          color: this.style.errorTextColor || this.theme.palette.getAccent600(),
          font: this.style.errorTextFont || fontHelper(this.theme.typography.title1),

        }
      }
      else{
        style = {
          color: this.style.emptyTextColor || this.theme.palette.getAccent600(),
          font: this.style.emptyTextFont || fontHelper(this.theme.typography.title1),

        }
      }
      return style
    },
    keyboardStyles: () => {

      return {
        height: this.style.height,
        width: this.style.width,
        background: this.style.background || this.theme.palette.getAccent100(),
        border: this.style.border,
        borderRadius: this.style.borderRadius
      }
    },
    sectionStyles: () => {
      return {
        background: this.style.categoryBackground || this.theme.palette.getAccent900(),
        border: this.style.border,
        borderRadius: this.style.borderRadius
      }
    }
  }
}
