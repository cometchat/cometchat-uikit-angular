import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatGroupsWithMessagesComponent } from './cometchat-groups-with-messages.component';

describe('CometChatGroupsWithMessagesComponent', () => {
let component: CometChatGroupsWithMessagesComponent;
let fixture: ComponentFixture<CometChatGroupsWithMessagesComponent>;

beforeEach(async () => {
await TestBed.configureTestingModule({
declarations: [ CometChatGroupsWithMessagesComponent ]
})
.compileComponents();
});

beforeEach(() => {
fixture = TestBed.createComponent(CometChatGroupsWithMessagesComponent);
component = fixture.componentInstance;
fixture.detectChanges();
});

it('should create', () => {
expect(component).toBeTruthy();
});
});