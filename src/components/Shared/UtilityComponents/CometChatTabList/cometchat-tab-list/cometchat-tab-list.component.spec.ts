import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatTabListComponent } from './cometchat-tab-list.component';

describe('CometChatTabListComponent', () => {
  let component: CometChatTabListComponent;
  let fixture: ComponentFixture<CometChatTabListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatTabListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatTabListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
