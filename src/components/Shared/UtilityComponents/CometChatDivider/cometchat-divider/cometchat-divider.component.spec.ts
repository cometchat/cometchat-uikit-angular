import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatDividerComponent } from './cometchat-divider.component';

describe('CometchatDividerComponent', () => {
  let component: CometChatDividerComponent;
  let fixture: ComponentFixture<CometChatDividerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatDividerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
