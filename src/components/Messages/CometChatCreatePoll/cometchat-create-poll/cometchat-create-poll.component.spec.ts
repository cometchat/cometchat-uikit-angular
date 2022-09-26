import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatCreatePollComponent } from './cometchat-create-poll.component';
describe('CometchatCreatePollComponent', () => {
  let component: CometChatCreatePollComponent;
  let fixture: ComponentFixture<CometChatCreatePollComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CometChatCreatePollComponent]
    })
      .compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatCreatePollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
