import { TestBed } from '@angular/core/testing';

import { CometchatAngularUiKitService } from './cometchat-angular-ui-kit.service';

describe('CometchatAngularUiKitService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CometchatAngularUiKitService = TestBed.get(CometchatAngularUiKitService);
    expect(service).toBeTruthy();
  });
});
