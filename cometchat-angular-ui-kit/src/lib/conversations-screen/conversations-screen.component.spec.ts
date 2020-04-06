import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationsScreenComponent } from './conversations-screen.component';

describe('ConversationsScreenComponent', () => {
  let component: ConversationsScreenComponent;
  let fixture: ComponentFixture<ConversationsScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationsScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationsScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
