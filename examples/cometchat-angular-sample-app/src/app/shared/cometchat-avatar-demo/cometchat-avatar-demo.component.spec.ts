import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatAvatarDemoComponent } from './cometchat-avatar-demo.component';

describe('CometChatAvatarDemoComponent', () => {
  let component: CometChatAvatarDemoComponent;
  let fixture: ComponentFixture<CometChatAvatarDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatAvatarDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAvatarDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
