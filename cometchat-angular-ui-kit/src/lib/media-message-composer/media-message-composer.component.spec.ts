import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaMessageComposerComponent } from './media-message-composer.component';

describe('MediaMessageComposerComponent', () => {
  let component: MediaMessageComposerComponent;
  let fixture: ComponentFixture<MediaMessageComposerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaMessageComposerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaMessageComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
