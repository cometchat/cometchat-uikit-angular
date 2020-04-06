import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaMessageComposerPreviewComponent } from './media-message-composer-preview.component';

describe('MediaMessageComposerPreviewComponent', () => {
  let component: MediaMessageComposerPreviewComponent;
  let fixture: ComponentFixture<MediaMessageComposerPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaMessageComposerPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaMessageComposerPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
