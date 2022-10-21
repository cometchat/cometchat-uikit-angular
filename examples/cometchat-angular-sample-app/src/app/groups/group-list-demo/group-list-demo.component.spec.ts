import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupListDemoComponent } from './group-list-demo.component';

describe('GroupListDemoComponent', () => {
  let component: GroupListDemoComponent;
  let fixture: ComponentFixture<GroupListDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupListDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupListDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
