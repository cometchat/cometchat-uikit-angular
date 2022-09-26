import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatLiveReactionsComponent } from './cometchat-live-reactions.component';

describe('CometchatLiveReactionsComponent', () => {
  let component: CometChatLiveReactionsComponent;
  let fixture: ComponentFixture<CometChatLiveReactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatLiveReactionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatLiveReactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
