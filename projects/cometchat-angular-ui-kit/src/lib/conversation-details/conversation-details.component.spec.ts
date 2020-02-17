import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationDetailsComponent } from './conversation-details.component';

describe('ConversationDetailsComponent', () => {
  let component: ConversationDetailsComponent;
  let fixture: ComponentFixture<ConversationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
