import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatConversationsWithMessagesComponent } from './cometchat-conversations-with-messages.component';

describe('CometChatConversationsWithMessagesComponent', () => {
let component: CometChatConversationsWithMessagesComponent;
let fixture: ComponentFixture<CometChatConversationsWithMessagesComponent>;

beforeEach(async () => {
await TestBed.configureTestingModule({
declarations: [ CometChatConversationsWithMessagesComponent ]
})
.compileComponents();
});

beforeEach(() => {
fixture = TestBed.createComponent(CometChatConversationsWithMessagesComponent);
component = fixture.componentInstance;
fixture.detectChanges();
});

it('should create', () => {
expect(component).toBeTruthy();
});
});