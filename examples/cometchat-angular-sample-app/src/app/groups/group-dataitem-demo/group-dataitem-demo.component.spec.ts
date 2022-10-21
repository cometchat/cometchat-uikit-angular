import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupDataitemDemoComponent } from './group-dataitem-demo.component';

describe('GroupDataitemDemoComponent', () => {
  let component: GroupDataitemDemoComponent;
  let fixture: ComponentFixture<GroupDataitemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupDataitemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupDataitemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
