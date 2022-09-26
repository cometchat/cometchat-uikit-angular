import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatDocumentBubbleComponent } from './cometchat-document-bubble.component';

describe('CometChatDocumentMessageBubbleComponent', () => {
  let component: CometChatDocumentBubbleComponent;
  let fixture: ComponentFixture<CometChatDocumentBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatDocumentBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDocumentBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
