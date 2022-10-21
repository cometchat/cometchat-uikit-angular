import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatLocalizeDemoComponent } from './cometchat-localize-demo.component';

describe('CometChatLocalizeDemoComponent', () => {
  let component: CometChatLocalizeDemoComponent;
  let fixture: ComponentFixture<CometChatLocalizeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatLocalizeDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatLocalizeDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
