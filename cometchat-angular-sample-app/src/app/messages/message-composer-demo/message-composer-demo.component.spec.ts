import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageComposerDemoComponent } from './message-composer-demo.component';

describe('MessageComposerDemoComponent', () => {
  let component: MessageComposerDemoComponent;
  let fixture: ComponentFixture<MessageComposerDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageComposerDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageComposerDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
