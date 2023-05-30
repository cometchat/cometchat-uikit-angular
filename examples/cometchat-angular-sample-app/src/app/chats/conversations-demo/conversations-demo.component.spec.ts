import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationsDemoComponent } from './conversations-demo.component';

describe('ConversationsDemoComponent', () => {
  let component: ConversationsDemoComponent;
  let fixture: ComponentFixture<ConversationsDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConversationsDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
