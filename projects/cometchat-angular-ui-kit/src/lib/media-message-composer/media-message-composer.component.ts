import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'media-message-composer',
  templateUrl: './media-message-composer.component.html',
  styleUrls: ['./media-message-composer.component.scss']
})
export class MediaMessageComposerComponent implements OnInit {
  listItems = [{ title: 'Image', id: 'image', icon: 'images_upload_icon' }, { title: 'File', id: 'file', icon: 'document_upload_icon' }, { title: 'Audio', id: 'audio', icon: 'camera_upload_icon' }, { title: 'Video', id: 'video', icon: 'camera_upload_icon' }, { title: 'Location', id: 'location', icon: 'camera_upload_icon' }];
  @Input() callBack?;


  constructor() { }

  ngOnInit() {
  }

  onItemClick(event, item) {
    if (this.callBack) {
      this.callBack(item, item.id);
    }
  }

}


