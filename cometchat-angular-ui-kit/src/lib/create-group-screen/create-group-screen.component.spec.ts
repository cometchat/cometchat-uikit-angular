import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupScreenComponent } from './create-group-screen.component';

describe('CreateGroupScreenComponent', () => {
  let component: CreateGroupScreenComponent;
  let fixture: ComponentFixture<CreateGroupScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateGroupScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateGroupScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
