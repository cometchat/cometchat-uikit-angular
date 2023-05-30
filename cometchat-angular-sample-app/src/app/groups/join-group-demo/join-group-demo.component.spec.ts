import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinGroupDemoComponent } from './join-group-demo.component';

describe('JoinGroupDemoComponent', () => {
  let component: JoinGroupDemoComponent;
  let fixture: ComponentFixture<JoinGroupDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoinGroupDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinGroupDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
