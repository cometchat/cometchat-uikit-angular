import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupConversationDetailsComponent } from './group-conversation-details.component';

describe('GroupConversationDetailsComponent', () => {
  let component: GroupConversationDetailsComponent;
  let fixture: ComponentFixture<GroupConversationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupConversationDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupConversationDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
