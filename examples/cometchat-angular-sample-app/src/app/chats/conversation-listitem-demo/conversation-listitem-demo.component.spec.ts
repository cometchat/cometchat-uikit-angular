import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationListitemDemoComponent } from './conversation-listitem-demo.component';

describe('ConversationListitemDemoComponent', () => {
  let component: ConversationListitemDemoComponent;
  let fixture: ComponentFixture<ConversationListitemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationListitemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationListitemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
