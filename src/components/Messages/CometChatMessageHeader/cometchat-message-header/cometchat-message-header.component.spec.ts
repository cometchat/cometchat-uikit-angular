import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatMessageHeaderComponent } from './cometchat-message-header.component';
describe('CometChatMessageHeaderComponent', () => {
  let component: CometChatMessageHeaderComponent;
  let fixture: ComponentFixture<CometChatMessageHeaderComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CometChatMessageHeaderComponent]
    })
      .compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
