import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationScreenComponent } from './conversation-screen.component';

describe('ConversationScreenComponent', () => {
  let component: ConversationScreenComponent;
  let fixture: ComponentFixture<ConversationScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
