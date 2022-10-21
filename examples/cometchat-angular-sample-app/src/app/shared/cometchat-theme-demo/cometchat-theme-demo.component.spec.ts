import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatThemeDemoComponent } from './cometchat-theme-demo.component';

describe('CometChatThemeDemoComponent', () => {
  let component: CometChatThemeDemoComponent;
  let fixture: ComponentFixture<CometChatThemeDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatThemeDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatThemeDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
