import { TestBed } from '@angular/core/testing';

import { AngularChatUiKitService } from './angular-chat-ui-kit.service';

describe('AngularChatUiKitService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AngularChatUiKitService = TestBed.get(AngularChatUiKitService);
    expect(service).toBeTruthy();
  });
});
