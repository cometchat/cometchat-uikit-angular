import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupDemoComponent } from './create-group-demo.component';

describe('CreateGroupDemoComponent', () => {
  let component: CreateGroupDemoComponent;
  let fixture: ComponentFixture<CreateGroupDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateGroupDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGroupDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
