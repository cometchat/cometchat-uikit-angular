import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationsListComponent } from './conversations-list.component';

describe('ConversationsListComponent', () => {
  let component: ConversationsListComponent;
  let fixture: ComponentFixture<ConversationsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConversationsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConversationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
