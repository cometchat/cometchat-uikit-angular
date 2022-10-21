import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatSoundManagerDemoComponent } from './cometchat-sound-manager-demo.component';

describe('CometChatSoundManagerDemoComponent', () => {
  let component: CometChatSoundManagerDemoComponent;
  let fixture: ComponentFixture<CometChatSoundManagerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatSoundManagerDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatSoundManagerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
