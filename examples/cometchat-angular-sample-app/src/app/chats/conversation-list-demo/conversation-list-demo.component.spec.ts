import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationListDemoComponent } from './conversation-list-demo.component';

describe('ConversationListDemoComponent', () => {
  let component: ConversationListDemoComponent;
  let fixture: ComponentFixture<ConversationListDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationListDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationListDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
