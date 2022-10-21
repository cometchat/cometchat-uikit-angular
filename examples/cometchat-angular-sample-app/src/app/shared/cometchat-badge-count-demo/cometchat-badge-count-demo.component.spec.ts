import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatBadgeCountComponent } from './cometchat-badge-count-demo.component';

describe('CometChatBadgeCountComponent', () => {
  let component: CometChatBadgeCountComponent;
  let fixture: ComponentFixture<CometChatBadgeCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatBadgeCountComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBadgeCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
