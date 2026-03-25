import { TestBed } from '@angular/core/testing';
import { Component, inject, Input, computed, booleanAttribute } from '@angular/core';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from './global-config.service';

// ============================================================
// Helper: A minimal component that mimics the 3-tier priority
// system used by real UIKit components (Input > GlobalConfig > default).
// ============================================================
@Component({ selector: 'test-config-consumer', standalone: true, template: '' })
class TestConfigConsumerComponent {
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  private _hideReceiptsExplicitlySet = false;
  private _hideReceipts = false;

  @Input({ transform: booleanAttribute })
  set hideReceipts(value: boolean) {
    this._hideReceipts = value;
    this._hideReceiptsExplicitlySet = true;
  }
  get hideReceipts(): boolean {
    return this._hideReceipts;
  }

  effectiveHideReceipts = computed(() => {
    if (this._hideReceiptsExplicitlySet) return this._hideReceipts;
    if (this.globalConfig?.hideReceipts !== undefined) return this.globalConfig.hideReceipts;
    return false;
  });
}

describe('COMETCHAT_GLOBAL_CONFIG', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should be defined as an InjectionToken', () => {
    expect(COMETCHAT_GLOBAL_CONFIG).toBeDefined();
  });

  it('should allow providing config via providers', () => {
    const testConfig: Partial<GlobalConfig> = {
      hideReceipts: true,
      hideError: false,
      showSearchBar: true,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: testConfig }],
    });

    const injectedConfig = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(injectedConfig).toEqual(testConfig);
  });

  it('should allow providing full config with all properties', () => {
    const fullConfig: GlobalConfig = {
      hideReceipts: true,
      hideError: true,
      hideUserStatus: true,
      hideGroupType: true,
      showScrollbar: true,
      showSearchBar: true,
      disableSoundForMessages: true,
      textFormatters: [{ name: 'test' }] as any[],
      disableDefaultContextMenu: true,
      disableSoundForCalls: true,
      customSoundForCalls: 'https://example.com/ring.mp3',
      customSoundForMessages: 'https://example.com/msg.mp3',
      hideAvatar: true,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: fullConfig }],
    });

    const injected = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(injected.hideReceipts).toBe(true);
    expect(injected.hideError).toBe(true);
    expect(injected.hideUserStatus).toBe(true);
    expect(injected.hideGroupType).toBe(true);
    expect(injected.showScrollbar).toBe(true);
    expect(injected.showSearchBar).toBe(true);
    expect(injected.disableSoundForMessages).toBe(true);
    expect(injected.textFormatters).toEqual([{ name: 'test' }]);
    expect(injected.disableDefaultContextMenu).toBe(true);
    expect(injected.disableSoundForCalls).toBe(true);
    expect(injected.customSoundForCalls).toBe('https://example.com/ring.mp3');
    expect(injected.customSoundForMessages).toBe('https://example.com/msg.mp3');
    expect(injected.hideAvatar).toBe(true);
  });

  it('should allow partial config — unset properties remain undefined', () => {
    const partialConfig: Partial<GlobalConfig> = { hideReceipts: true };

    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: partialConfig }],
    });

    const injected = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(injected.hideReceipts).toBe(true);
    expect(injected.hideError).toBeUndefined();
    expect(injected.showSearchBar).toBeUndefined();
    expect(injected.disableDefaultContextMenu).toBeUndefined();
    expect(injected.customSoundForCalls).toBeUndefined();
    expect(injected.hideAvatar).toBeUndefined();
  });

  it('should support factory provider pattern', () => {
    const factoryFn = () => ({
      hideReceipts: true,
      showSearchBar: false,
      customSoundForCalls: 'ring.mp3',
    });

    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useFactory: factoryFn }],
    });

    const injected = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(injected.hideReceipts).toBe(true);
    expect(injected.showSearchBar).toBe(false);
    expect(injected.customSoundForCalls).toBe('ring.mp3');
  });
});

describe('GlobalConfig Interface', () => {
  it('should accept all boolean properties', () => {
    const config: GlobalConfig = {
      hideReceipts: true,
      hideError: false,
      hideUserStatus: true,
      hideGroupType: false,
      showScrollbar: true,
      showSearchBar: false,
      disableSoundForMessages: true,
      disableDefaultContextMenu: false,
      disableSoundForCalls: true,
      hideAvatar: false,
    };

    expect(config.hideReceipts).toBe(true);
    expect(config.hideError).toBe(false);
    expect(config.hideUserStatus).toBe(true);
    expect(config.hideGroupType).toBe(false);
    expect(config.showScrollbar).toBe(true);
    expect(config.showSearchBar).toBe(false);
    expect(config.disableSoundForMessages).toBe(true);
    expect(config.disableDefaultContextMenu).toBe(false);
    expect(config.disableSoundForCalls).toBe(true);
    expect(config.hideAvatar).toBe(false);
  });

  it('should accept string properties for custom sounds', () => {
    const config: GlobalConfig = {
      customSoundForCalls: 'https://cdn.example.com/call-ring.mp3',
      customSoundForMessages: 'https://cdn.example.com/message-ding.wav',
    };

    expect(config.customSoundForCalls).toBe('https://cdn.example.com/call-ring.mp3');
    expect(config.customSoundForMessages).toBe('https://cdn.example.com/message-ding.wav');
  });

  it('should accept textFormatters array', () => {
    const config: GlobalConfig = {
      textFormatters: [
        { name: 'url', type: 'link' },
        { name: 'mention', type: 'user' },
      ] as any[],
    };

    expect(config.textFormatters).toHaveLength(2);
    expect((config.textFormatters![0] as any).name).toBe('url');
  });

  it('should allow empty config object', () => {
    const config: GlobalConfig = {};
    expect(config).toEqual({});
  });
});

describe('GlobalConfig Default Values (no provider)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should return null when injected with { optional: true } and no provider', () => {
    TestBed.configureTestingModule({});
    // optional injection returns null when no provider is registered
    const config = TestBed.inject(COMETCHAT_GLOBAL_CONFIG, null);
    expect(config).toBeNull();
  });

  it('should throw when injected without optional flag and no provider', () => {
    TestBed.configureTestingModule({});
    expect(() => TestBed.inject(COMETCHAT_GLOBAL_CONFIG)).toThrow();
  });
});

describe('GlobalConfig Null/Undefined Handling', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should handle null provided as config value', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: null }],
    });

    const config = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(config).toBeNull();
  });

  it('should handle undefined provided as config value', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: undefined }],
    });

    const config = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(config).toBeUndefined();
  });

  it('should handle config with explicitly null property values', () => {
    const config = {
      hideReceipts: null as any,
      customSoundForCalls: null as any,
      textFormatters: null as any,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: config }],
    });

    const injected = TestBed.inject(COMETCHAT_GLOBAL_CONFIG);
    expect(injected.hideReceipts).toBeNull();
    expect(injected.customSoundForCalls).toBeNull();
    expect(injected.textFormatters).toBeNull();
  });
});

describe('GlobalConfig Override Behavior (3-tier priority)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('should use global config value when no @Input is explicitly set', () => {
    TestBed.configureTestingModule({
      imports: [TestConfigConsumerComponent],
      providers: [
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: { hideReceipts: true } satisfies Partial<GlobalConfig>,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestConfigConsumerComponent);
    fixture.detectChanges();

    // No @Input set → global config value (true) should be used
    expect(fixture.componentInstance.effectiveHideReceipts()).toBe(true);
  });

  it('should use component default when no @Input and no global config', () => {
    TestBed.configureTestingModule({
      imports: [TestConfigConsumerComponent],
      // No COMETCHAT_GLOBAL_CONFIG provider → globalConfig is null
    });

    const fixture = TestBed.createComponent(TestConfigConsumerComponent);
    fixture.detectChanges();

    // No @Input, no global config → component default (false)
    expect(fixture.componentInstance.effectiveHideReceipts()).toBe(false);
  });

  it('should let @Input override global config value', () => {
    TestBed.configureTestingModule({
      imports: [TestConfigConsumerComponent],
      providers: [
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: { hideReceipts: true } satisfies Partial<GlobalConfig>,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestConfigConsumerComponent);
    fixture.componentInstance.hideReceipts = false; // explicit @Input
    fixture.detectChanges();

    // @Input (false) takes precedence over global config (true)
    expect(fixture.componentInstance.effectiveHideReceipts()).toBe(false);
  });

  it('should use component default when global config property is undefined', () => {
    TestBed.configureTestingModule({
      imports: [TestConfigConsumerComponent],
      providers: [
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: { showSearchBar: true } satisfies Partial<GlobalConfig>,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestConfigConsumerComponent);
    fixture.detectChanges();

    // hideReceipts not in global config → falls through to default (false)
    expect(fixture.componentInstance.effectiveHideReceipts()).toBe(false);
  });

  it('should let @Input=true override global config=false', () => {
    TestBed.configureTestingModule({
      imports: [TestConfigConsumerComponent],
      providers: [
        {
          provide: COMETCHAT_GLOBAL_CONFIG,
          useValue: { hideReceipts: false } satisfies Partial<GlobalConfig>,
        },
      ],
    });

    const fixture = TestBed.createComponent(TestConfigConsumerComponent);
    fixture.componentInstance.hideReceipts = true;
    fixture.detectChanges();

    expect(fixture.componentInstance.effectiveHideReceipts()).toBe(true);
  });
});
