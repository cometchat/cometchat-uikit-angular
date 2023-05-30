import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatCallHistoryWithDetailsComponent } from './cometchat-call-history-with-details.component';

describe('CometChatCallHistoryWithDetailsComponent', () => {
let component: CometChatCallHistoryWithDetailsComponent;
let fixture: ComponentFixture<CometChatCallHistoryWithDetailsComponent>;

beforeEach(async () => {
await TestBed.configureTestingModule({
declarations: [ CometChatCallHistoryWithDetailsComponent ]
})
.compileComponents();
});

beforeEach(() => {
fixture = TestBed.createComponent(CometChatCallHistoryWithDetailsComponent);
component = fixture.componentInstance;
fixture.detectChanges();
});

it('should create', () => {
expect(component).toBeTruthy();
});
});