import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatConfirmDialogComponent } from './cometchat-confirm-dialog.component';

describe('CometchatConfirmDialogComponent', () => {
  let component: CometchatConfirmDialogComponent;
  let fixture: ComponentFixture<CometchatConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
