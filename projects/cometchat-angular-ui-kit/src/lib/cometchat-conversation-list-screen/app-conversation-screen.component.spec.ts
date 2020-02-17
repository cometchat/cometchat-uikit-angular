import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppConversationScreenComponent } from './app-conversation-screen.component';

describe('AppConversationScreenComponent', () => {
  let component: AppConversationScreenComponent;
  let fixture: ComponentFixture<AppConversationScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppConversationScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppConversationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
