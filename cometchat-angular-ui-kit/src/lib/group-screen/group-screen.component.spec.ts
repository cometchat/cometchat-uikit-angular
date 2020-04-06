import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupScreenComponent } from './group-screen.component';

describe('GroupScreenComponent', () => {
  let component: GroupScreenComponent;
  let fixture: ComponentFixture<GroupScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
