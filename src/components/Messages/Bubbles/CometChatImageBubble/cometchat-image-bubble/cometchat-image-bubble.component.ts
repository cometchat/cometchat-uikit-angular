import { Component,
  Input,
  OnInit,
  HostListener, 
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef} from '@angular/core';
import { MetadataKey } from '../../../../Shared/Constants/UIKitConstants';
import {styles} from '../../../../Shared/Types/interface'
import { checkMessageForExtensionsData, checkHasOwnProperty } from '../../../../Shared/Helpers/CometChatHelper';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatMessageEvents } from '../../../CometChatMessageEvents.service';
import { CometChatTheme } from '../../../../Shared/PrimaryComponents/CometChatTheme/CometChatTheme';
@Component({
  selector: 'cometchat-image-bubble',
  templateUrl: './cometchat-image-bubble.component.html',
  styleUrls: ['./cometchat-image-bubble.component.scss']
})
export class CometChatImageBubbleComponent implements OnInit,OnChanges {
  @Input() messageObject: CometChat.BaseMessage | null = null;
  @Input() imageUrl:string = "";
  public isUnsafe:boolean = false;
  @Input() style:styles = {
    width: "100%",
	  height: "100%",
	  border: "none",
	  background: "",
	  borderRadius: "12px",
  };
  @Input () overayIconURL:string = "assets/resources/unsafe-content.svg";
  @Input() theme: CometChatTheme = new CometChatTheme({});
  imageLoader: boolean = false;
  innerWidth!:number;
  checkScreenSize: boolean = false;
  checkReaction:any[]= [];
  avatar:string | null = null;
  name: string = '';
  avatarIfGroup: boolean = false;
  timer: any= null;
  constructor(private ref:ChangeDetectorRef, private messageEvents:CometChatMessageEvents) { }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes["messageObject"]){
      if(changes["messageObject"].currentValue.data.metadata
       && changes["messageObject"].currentValue.data.metadata["@injected"]
       && changes["messageObject"].currentValue.data.metadata["@injected"].extensions
       && changes["messageObject"].currentValue.data.metadata["@injected"].extensions["image-moderation"]
       ){
         if(changes["messageObject"].currentValue.data.metadata["@injected"].extensions["image-moderation"].unsafe == "yes" && Number(changes["messageObject"].currentValue.data.metadata["@injected"].extensions["image-moderation"].confidence) > 50){
           this.isUnsafe = true;
         }
         else{
           this.isUnsafe = false;
         }
       }
       else{
         this.setMessageImageUrl()

       }
    }
  }
  ngOnInit(): void {
    try {
      this.checkReaction = checkMessageForExtensionsData(
        (this.messageObject as CometChat.BaseMessage),
        MetadataKey.extensions.reactions
      );
      if(this.imageUrl && (this.imageUrl !== "")) {
        this.imageUrl = this.imageUrl;
      } else if (this.messageObject && (Object.keys(this.messageObject).length !== 0)) {
        this.setImage();
      }
    } catch (error:any) {
     this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
   /**
   * Checks when window size is changed in realtime
   */
 
    setImage() {	
      try {	
        if (checkHasOwnProperty(this.messageObject,MetadataKey.metadata)) {	
          const metadata:any = (this.messageObject as CometChat.TextMessage).getMetadata();
          if(checkHasOwnProperty(metadata,MetadataKey.injected)) {	
            const injectedObject = metadata[MetadataKey.injected];	
            if (injectedObject && checkHasOwnProperty(injectedObject,MetadataKey.extension)) {	
              const extensionsObject = injectedObject[MetadataKey.extension];	
              if (	
                  extensionsObject &&	
                  checkHasOwnProperty(extensionsObject,MetadataKey.extensions.thumbnailGeneration)	
                 ) {	
                  const thumbnailGenerationObject = extensionsObject[MetadataKey.extensions.thumbnailGeneration];	
                  const imageToDownload = this.chooseImage(thumbnailGenerationObject);	
                  this.downloadImage(imageToDownload).then((response) => {	
                    let img = new Image();	
                    img.src = imageToDownload;	
                    img.onload = () => {	
                        this.imageLoader = false;	
                        this.imageUrl = img.src;	
                        URL.revokeObjectURL(img.src);	
                        this.ref.detectChanges()
                    };	
                  })	
                 } 	
                 else{
                  this.setMessageImageUrl();	
                 }
            } else {	
              this.setMessageImageUrl();	
            } 	
          }	
          else {	
            this.setMessageImageUrl();	
          }	
        }	
        else{
          this.setMessageImageUrl();	
        }
      } catch (error:any) {	
       this.messageEvents.publishEvents(this.messageEvents.onError, error);	
      }	
      this.ref.detectChanges()
    }	
     /**
   * Sets image url i.e medium-size or small-size
   * @param thumbnailGenerationObject
   */
  chooseImage(thumbnailGenerationObject: any) {

    try {
      const mediumUrl = thumbnailGenerationObject["url_medium"];
      return mediumUrl;
    } catch (error:any) {
     this.messageEvents.publishEvents(this.messageEvents.onError, error);
    }
  }
  /**	
   * If thumnail-generation extension is not present then sets default URL	
   * @param	
   */	
   setMessageImageUrl() {	
    const metadata = MetadataKey.metadata;	
		const fileMetadata = this.getMessageFileMetadata((this.messageObject as CometChat.BaseMessage), metadata);	
		let img: any = new Image();	
    if (fileMetadata instanceof Blob) {	
			const reader = new FileReader();	
			reader.onload = function() {	
				img.src = reader.result;
			};	
			reader.readAsDataURL(fileMetadata);	
      this.ref.detectChanges()
    }	
    else {
      if((this.messageObject as any).data?.attachments)	{
        img.src = (this.messageObject as any).data?.attachments[0].url;	
        img.onload = () => {		
          this.imageUrl = img.src;	
          this.ref.detectChanges()
        };	

      }
  
      this.ref.detectChanges()
    } 	
		img.onload = () => {	
			//only if there is a change in the image path, update state	
			if (this.imageUrl !== img.src) {	
				this.imageUrl = img.src,	
        this.ref.detectChanges()
			}	
		};	
    this.ref.detectChanges()
	};	
    getMessageFileMetadata(message: CometChat.BaseMessage, MetadataKey: any) {	
      let fileMetadata;	
      if(checkHasOwnProperty(message,MetadataKey)) {	
         fileMetadata = (message as any)[MetadataKey];	
      }	
      return fileMetadata;	
    }
    open() {	
      try {	
      } catch (error:any) {	
       this.messageEvents.publishEvents(this.messageEvents.onError, error);	
      }	
    }
    /**
   * Downloads image from server
   * @param imgUrl
   */
  downloadImage(imgUrl: string) {
    const promise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", imgUrl, true);
      xhr.responseType = "blob";
      xhr.onload = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            this.timer = null;
            resolve(xhr.response);
          } else if (xhr.status === 403) {
            this.timer = setTimeout(() => {
              this.downloadImage(imgUrl)
                .then((response) => resolve(response))
                .catch((error:any) => reject(error));
            }, 800);
          }
        } else {
          reject(xhr.statusText);
        }
      };
      xhr.onerror = (event) =>
        reject(new Error("There was a network error."));
      xhr.ontimeout = (event) =>
        reject(new Error("There was a timeout error."));
      xhr.send();
    });
    return promise;
  }
// styling for image bubble
  imageBubbleStyle: any = {
    messageKitBlockStyle: () => {
      return {
        height: !this.imageUrl ? "200px" : this.style.height,
        width: !this.imageUrl ? "230px" : this.style.width,
        border: this.style.border,
        borderRadius: this.style.borderRadius,
        background: this.style.background,
      }
    },
    moderatedImageStyle:()=>{
      return {
        filter: this.isUnsafe ? "blur(6px) " : null,
        zIndex:"5",
      }
    },
    unsafeIconStyle:()=>{
      return {
        zIndex: this.isUnsafe ? "10" : "-10",
        display: this.isUnsafe ? "block" : "none",
        background:"transparent",
        position: "absolute",
        left: "50%",
        bottom: "50%",
      }
    }
  }
}
