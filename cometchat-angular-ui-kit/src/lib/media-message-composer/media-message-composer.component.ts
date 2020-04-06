import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';



/**
 * Component
 * * Media message composer.
 * * basically it can compose the media message for cometchat and emits the event on selected meida message input.
 */
@Component({
  selector: 'media-message-composer',
  templateUrl: './media-message-composer.component.html',
  styleUrls: ['./media-message-composer.component.scss']
})
export class MediaMessageComposerComponent {

  // *Array of option menu to be shown for the media options.
  listItems = [
    { title: 'Video', icon: '../../assets/icon_set/videocam-24px.svg', id: 'video' },
    { title: 'Audio', icon: '../../assets/icon_set/audiotrack-24px.svg', id: 'audio' },
    { title: 'File', icon: '../../assets/icon_set/insert_drive_file-24px.svg', id: 'file' },
    { title: 'Image', icon: '../../assets/icon_set/image-24px.svg', id: 'image' },
    // { title: 'White Borad', icon: '../../assets/icon_set/gesture-24px.svg', id: 'whiteBoard' },
    // { title: 'Write Borad', icon: '../../assets/icon_set/edit-blue-icon.svg', id: 'writeBoard' },
    // { title: 'BrboadCast', icon: '../../assets/icon_set/headset_mic-24px.svg', id: 'broadcast' },
    // { title: 'BrboadCast-Demo', icon: '../../assets/icon_set/headset_mic-24px.svg', id: 'broadcastDemo' },
  ];

  // * Optional callback function provided as an @Input,( Not in use as of now.) called on any option menu item is selected/ clicked.
  @Input() callBack?;

  // * @Output event to be emitted on any option menu item is selected/ clicked. 
  @Output() mediaOptionSelected = new EventEmitter<{ item: object, id: string }>();
  constructor() { }

  /**
   * Determines whether item click on, and will emit the event on item clicked/ selected. with object={item:object,id:string}.
   * @param event :any
   * @param item :item
   */
  onItemClick = (event, item) => {
    this.mediaOptionSelected.emit({ item, id: item.id });


    // * callback function deprecated, instead replaced by the @Output anotation of angular.
    /* if (this.callBack) {
      this.callBack(item, item.id);
    } */
  }

}
