import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationsWithMessagesDemoComponent } from './conversations-with-messages-demo.component';

describe('ConversationsWithMessagesDemoComponent', () => {
  let component: ConversationsWithMessagesDemoComponent;
  let fixture: ComponentFixture<ConversationsWithMessagesDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationsWithMessagesDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationsWithMessagesDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
