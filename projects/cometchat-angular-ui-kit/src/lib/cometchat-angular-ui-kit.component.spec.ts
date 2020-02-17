import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatAngularUiKitComponent } from './cometchat-angular-ui-kit.component';

describe('CometchatAngularUiKitComponent', () => {
  let component: CometchatAngularUiKitComponent;
  let fixture: ComponentFixture<CometchatAngularUiKitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatAngularUiKitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatAngularUiKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
