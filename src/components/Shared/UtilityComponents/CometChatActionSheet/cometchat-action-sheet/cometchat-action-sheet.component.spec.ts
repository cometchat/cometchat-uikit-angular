import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatActionSheetComponent } from './cometchat-action-sheet.component';

describe('CometChatActionSheetComponent', () => {
  let component: CometChatActionSheetComponent;
  let fixture: ComponentFixture<CometChatActionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatActionSheetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatActionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
