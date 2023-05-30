import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatTabsComponent } from './cometchat-tabs.component';

describe('CometChatTabsComponent', () => {
  let component: CometChatTabsComponent;
  let fixture: ComponentFixture<CometChatTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatTabsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
