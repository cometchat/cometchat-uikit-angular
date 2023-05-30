import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupsDemoComponent } from './groups-demo.component';

describe('GroupsDemoComponent', () => {
  let component: GroupsDemoComponent;
  let fixture: ComponentFixture<GroupsDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupsDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupsDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
