import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatConfirmDialogComponent } from './cometchat-confirm-dialog.component';
describe('CometchatConfirmDialogComponent', () => {
  let component: CometChatConfirmDialogComponent;
  let fixture: ComponentFixture<CometChatConfirmDialogComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatConfirmDialogComponent]
    })
      .compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
