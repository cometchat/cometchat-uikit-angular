import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatConversationListItemDemoComponent } from './cometchat-conversation-list-item-demo.component';

describe('CometChatConversationListItemDemoComponent', () => {
  let component: CometChatConversationListItemDemoComponent;
  let fixture: ComponentFixture<CometChatConversationListItemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatConversationListItemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatConversationListItemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
