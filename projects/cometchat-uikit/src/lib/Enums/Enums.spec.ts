/**
 * Enums Tests
 *
 * Categories: Numeric Enums, String Enums, Enum Completeness, Enum Values
 * Validates: Requirements 8.1, 14.4, 14.5, 15.7
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  AuxiliaryButtonAlignment,
  EnterKeyBehavior,
  Placement,
  MessageListAlignment,
  MessageBubbleAlignment,
  DocumentIconAlignment,
  TabAlignment,
  MessageStatus,
  Receipts,
  TitleAlignment,
  SelectionMode,
  States,
  TimestampAlignment,
  IconButtonAlignment,
  RecordingType,
  TabsVisibility,
  CallWorkflow,
  PanelAlignment,
  LabelAlignment,
  ElementType,
  ButtonAction,
  HTTPSRequestMethods,
  DateTimePickerMode,
  UserMemberListType,
  MouseEventSource,
  PreviewMessageMode,
  MentionsTargetElement,
  MentionsVisibility,
  CometChatSearchScope,
  CometChatSearchFilter,
  MentionType,
} from './Enums';

/** Helper: get named keys from a numeric enum (filters out reverse mappings). */
function numericEnumKeys(enumObj: Record<string, unknown>): string[] {
  return Object.keys(enumObj).filter(k => isNaN(Number(k)));
}

describe('Enums', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  // ─── Numeric Enums ───

  describe('AuxiliaryButtonAlignment', () => {
    it('should have left=0 and right=1', () => {
      expect(AuxiliaryButtonAlignment.left).toBe(0);
      expect(AuxiliaryButtonAlignment.right).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(AuxiliaryButtonAlignment)).toEqual(['left', 'right']);
    });
  });

  describe('MessageListAlignment', () => {
    it('should have left=0 and standard=1', () => {
      expect(MessageListAlignment.left).toBe(0);
      expect(MessageListAlignment.standard).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(MessageListAlignment)).toEqual(['left', 'standard']);
    });
  });

  describe('MessageBubbleAlignment', () => {
    it('should have left=0, right=1, center=2', () => {
      expect(MessageBubbleAlignment.left).toBe(0);
      expect(MessageBubbleAlignment.right).toBe(1);
      expect(MessageBubbleAlignment.center).toBe(2);
    });

    it('should have exactly 3 members', () => {
      expect(numericEnumKeys(MessageBubbleAlignment)).toEqual(['left', 'right', 'center']);
    });
  });

  describe('DocumentIconAlignment', () => {
    it('should have left=0 and right=1', () => {
      expect(DocumentIconAlignment.left).toBe(0);
      expect(DocumentIconAlignment.right).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(DocumentIconAlignment)).toEqual(['left', 'right']);
    });
  });

  describe('TabAlignment', () => {
    it('should have top=0, bottom=1, left=2, right=3', () => {
      expect(TabAlignment.top).toBe(0);
      expect(TabAlignment.bottom).toBe(1);
      expect(TabAlignment.left).toBe(2);
      expect(TabAlignment.right).toBe(3);
    });

    it('should have exactly 4 members', () => {
      expect(numericEnumKeys(TabAlignment)).toEqual(['top', 'bottom', 'left', 'right']);
    });
  });

  describe('MessageStatus', () => {
    it('should have inprogress=0, success=1, error=2, cancelled=3', () => {
      expect(MessageStatus.inprogress).toBe(0);
      expect(MessageStatus.success).toBe(1);
      expect(MessageStatus.error).toBe(2);
      expect(MessageStatus.cancelled).toBe(3);
    });

    it('should have exactly 4 members', () => {
      expect(numericEnumKeys(MessageStatus)).toEqual([
        'inprogress',
        'success',
        'error',
        'cancelled',
      ]);
    });
  });

  describe('Receipts', () => {
    it('should have wait=0, sent=1, delivered=2, read=3, error=4', () => {
      expect(Receipts.wait).toBe(0);
      expect(Receipts.sent).toBe(1);
      expect(Receipts.delivered).toBe(2);
      expect(Receipts.read).toBe(3);
      expect(Receipts.error).toBe(4);
    });

    it('should have exactly 5 members', () => {
      expect(numericEnumKeys(Receipts)).toEqual(['wait', 'sent', 'delivered', 'read', 'error']);
    });
  });

  describe('TitleAlignment', () => {
    it('should have left=0 and center=1', () => {
      expect(TitleAlignment.left).toBe(0);
      expect(TitleAlignment.center).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(TitleAlignment)).toEqual(['left', 'center']);
    });
  });

  describe('SelectionMode', () => {
    it('should have single=0, multiple=1, none=2', () => {
      expect(SelectionMode.single).toBe(0);
      expect(SelectionMode.multiple).toBe(1);
      expect(SelectionMode.none).toBe(2);
    });

    it('should have exactly 3 members', () => {
      expect(numericEnumKeys(SelectionMode)).toEqual(['single', 'multiple', 'none']);
    });
  });

  describe('States', () => {
    it('should have loading=0, empty=1, error=2, loaded=3', () => {
      expect(States.loading).toBe(0);
      expect(States.empty).toBe(1);
      expect(States.error).toBe(2);
      expect(States.loaded).toBe(3);
    });

    it('should have exactly 4 members', () => {
      expect(numericEnumKeys(States)).toEqual(['loading', 'empty', 'error', 'loaded']);
    });
  });

  describe('TimestampAlignment', () => {
    it('should have top=0 and bottom=1', () => {
      expect(TimestampAlignment.top).toBe(0);
      expect(TimestampAlignment.bottom).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(TimestampAlignment)).toEqual(['top', 'bottom']);
    });
  });

  describe('RecordingType', () => {
    it('should have audio=0 and video=1', () => {
      expect(RecordingType.audio).toBe(0);
      expect(RecordingType.video).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(RecordingType)).toEqual(['audio', 'video']);
    });
  });

  describe('TabsVisibility', () => {
    it('should have usersAndGroups=0, users=1, groups=2', () => {
      expect(TabsVisibility.usersAndGroups).toBe(0);
      expect(TabsVisibility.users).toBe(1);
      expect(TabsVisibility.groups).toBe(2);
    });

    it('should have exactly 3 members', () => {
      expect(numericEnumKeys(TabsVisibility)).toEqual(['usersAndGroups', 'users', 'groups']);
    });
  });

  describe('CallWorkflow', () => {
    it('should have defaultCalling=0 and directCalling=1', () => {
      expect(CallWorkflow.defaultCalling).toBe(0);
      expect(CallWorkflow.directCalling).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(CallWorkflow)).toEqual(['defaultCalling', 'directCalling']);
    });
  });

  describe('PanelAlignment', () => {
    it('should have composerHeader=0, messageListHeader=1, messageListFooter=2, messages=3', () => {
      expect(PanelAlignment.composerHeader).toBe(0);
      expect(PanelAlignment.messageListHeader).toBe(1);
      expect(PanelAlignment.messageListFooter).toBe(2);
      expect(PanelAlignment.messages).toBe(3);
    });

    it('should have exactly 4 members', () => {
      expect(numericEnumKeys(PanelAlignment)).toEqual([
        'composerHeader',
        'messageListHeader',
        'messageListFooter',
        'messages',
      ]);
    });
  });

  describe('UserMemberListType', () => {
    it('should have users=0 and groupmembers=1', () => {
      expect(UserMemberListType.users).toBe(0);
      expect(UserMemberListType.groupmembers).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(UserMemberListType)).toEqual(['users', 'groupmembers']);
    });
  });

  describe('MouseEventSource', () => {
    it('should have mentions=0', () => {
      expect(MouseEventSource.mentions).toBe(0);
    });

    it('should have exactly 1 member', () => {
      expect(numericEnumKeys(MouseEventSource)).toEqual(['mentions']);
    });
  });

  describe('PreviewMessageMode', () => {
    it('should have edit=0 and none=1', () => {
      expect(PreviewMessageMode.edit).toBe(0);
      expect(PreviewMessageMode.none).toBe(1);
    });

    it('should have exactly 2 members', () => {
      expect(numericEnumKeys(PreviewMessageMode)).toEqual(['edit', 'none']);
    });
  });

  describe('MentionsTargetElement', () => {
    it('should have textinput=0, textbubble=1, conversation=2', () => {
      expect(MentionsTargetElement.textinput).toBe(0);
      expect(MentionsTargetElement.textbubble).toBe(1);
      expect(MentionsTargetElement.conversation).toBe(2);
    });

    it('should have exactly 3 members', () => {
      expect(numericEnumKeys(MentionsTargetElement)).toEqual([
        'textinput',
        'textbubble',
        'conversation',
      ]);
    });
  });

  describe('MentionsVisibility', () => {
    it('should have usersConversationOnly=0, groupConversationOnly=1, both=2', () => {
      expect(MentionsVisibility.usersConversationOnly).toBe(0);
      expect(MentionsVisibility.groupConversationOnly).toBe(1);
      expect(MentionsVisibility.both).toBe(2);
    });

    it('should have exactly 3 members', () => {
      expect(numericEnumKeys(MentionsVisibility)).toEqual([
        'usersConversationOnly',
        'groupConversationOnly',
        'both',
      ]);
    });
  });

  // ─── String Enums ───

  describe('EnterKeyBehavior', () => {
    it('should have correct string values', () => {
      expect(EnterKeyBehavior.SendMessage).toBe('sendMessage');
      expect(EnterKeyBehavior.NewLine).toBe('newLine');
      expect(EnterKeyBehavior.None).toBe('none');
    });

    it('should have exactly 3 members', () => {
      expect(Object.keys(EnterKeyBehavior)).toEqual(['SendMessage', 'NewLine', 'None']);
    });
  });

  describe('Placement', () => {
    it('should have correct string values', () => {
      expect(Placement.top).toBe('top');
      expect(Placement.right).toBe('right');
      expect(Placement.bottom).toBe('bottom');
      expect(Placement.left).toBe('left');
    });

    it('should have exactly 4 members', () => {
      expect(Object.keys(Placement)).toEqual(['top', 'right', 'bottom', 'left']);
    });
  });

  describe('IconButtonAlignment', () => {
    it('should map to CSS flex-direction values', () => {
      expect(IconButtonAlignment.top).toBe('column');
      expect(IconButtonAlignment.bottom).toBe('column-reverse');
      expect(IconButtonAlignment.left).toBe('row');
      expect(IconButtonAlignment.right).toBe('row-reverse');
    });

    it('should have exactly 4 members', () => {
      expect(Object.keys(IconButtonAlignment)).toEqual(['top', 'bottom', 'left', 'right']);
    });
  });

  describe('LabelAlignment', () => {
    it('should map to CSS flex-direction values', () => {
      expect(LabelAlignment.top).toBe('column');
      expect(LabelAlignment.bottom).toBe('column-reverse');
      expect(LabelAlignment.left).toBe('row');
      expect(LabelAlignment.right).toBe('row-reverse');
    });

    it('should have exactly 4 members', () => {
      expect(Object.keys(LabelAlignment)).toEqual(['top', 'bottom', 'left', 'right']);
    });
  });

  describe('ElementType', () => {
    it('should have correct string values', () => {
      expect(ElementType.label).toBe('label');
      expect(ElementType.text).toBe('textInput');
      expect(ElementType.dropdown).toBe('dropdown');
      expect(ElementType.checkbox).toBe('checkbox');
      expect(ElementType.radio).toBe('radio');
      expect(ElementType.button).toBe('button');
      expect(ElementType.singleSelect).toBe('singleSelect');
      expect(ElementType.dateTime).toBe('dateTime');
    });

    it('should have exactly 8 members', () => {
      expect(Object.keys(ElementType)).toEqual([
        'label',
        'text',
        'dropdown',
        'checkbox',
        'radio',
        'button',
        'singleSelect',
        'dateTime',
      ]);
    });
  });

  describe('ButtonAction', () => {
    it('should have correct string values', () => {
      expect(ButtonAction.apiAction).toBe('apiAction');
      expect(ButtonAction.urlNavigation).toBe('urlNavigation');
      expect(ButtonAction.custom).toBe('custom');
    });

    it('should have exactly 3 members', () => {
      expect(Object.keys(ButtonAction)).toEqual(['apiAction', 'urlNavigation', 'custom']);
    });
  });

  describe('HTTPSRequestMethods', () => {
    it('should have correct uppercase string values', () => {
      expect(HTTPSRequestMethods.POST).toBe('POST');
      expect(HTTPSRequestMethods.PUT).toBe('PUT');
      expect(HTTPSRequestMethods.PATCH).toBe('PATCH');
      expect(HTTPSRequestMethods.DELETE).toBe('DELETE');
    });

    it('should have exactly 4 members', () => {
      expect(Object.keys(HTTPSRequestMethods)).toEqual(['POST', 'PUT', 'PATCH', 'DELETE']);
    });
  });

  describe('DateTimePickerMode', () => {
    it('should have correct string values', () => {
      expect(DateTimePickerMode.date).toBe('date');
      expect(DateTimePickerMode.dateTime).toBe('dateTime');
      expect(DateTimePickerMode.time).toBe('time');
    });

    it('should have exactly 3 members', () => {
      expect(Object.keys(DateTimePickerMode)).toEqual(['date', 'dateTime', 'time']);
    });
  });

  describe('CometChatSearchScope', () => {
    it('should have correct string values', () => {
      expect(CometChatSearchScope.Conversations).toBe('conversations');
      expect(CometChatSearchScope.Messages).toBe('messages');
    });

    it('should have exactly 2 members', () => {
      expect(Object.keys(CometChatSearchScope)).toEqual(['Conversations', 'Messages']);
    });
  });

  describe('CometChatSearchFilter', () => {
    it('should have correct string values for all 9 filters', () => {
      expect(CometChatSearchFilter.Messages).toBe('messages');
      expect(CometChatSearchFilter.Conversations).toBe('conversations');
      expect(CometChatSearchFilter.Unread).toBe('unread');
      expect(CometChatSearchFilter.Groups).toBe('groups');
      expect(CometChatSearchFilter.Photos).toBe('photos');
      expect(CometChatSearchFilter.Videos).toBe('videos');
      expect(CometChatSearchFilter.Links).toBe('links');
      expect(CometChatSearchFilter.Documents).toBe('files');
      expect(CometChatSearchFilter.Audio).toBe('audio');
    });

    it('should have exactly 9 members', () => {
      expect(Object.keys(CometChatSearchFilter)).toEqual([
        'Messages',
        'Conversations',
        'Unread',
        'Groups',
        'Photos',
        'Videos',
        'Links',
        'Documents',
        'Audio',
      ]);
    });
  });

  describe('MentionType', () => {
    it('should have correct string values', () => {
      expect(MentionType.self).toBe('self');
      expect(MentionType.other).toBe('other');
      expect(MentionType.channel).toBe('channel');
    });

    it('should have exactly 3 members', () => {
      expect(Object.keys(MentionType)).toEqual(['self', 'other', 'channel']);
    });
  });

  // ─── Cross-Cutting Enum Integrity ───

  describe('Enum Integrity', () => {
    it('should have IconButtonAlignment and LabelAlignment share the same flex-direction mapping', () => {
      expect(IconButtonAlignment.top).toBe(LabelAlignment.top);
      expect(IconButtonAlignment.bottom).toBe(LabelAlignment.bottom);
      expect(IconButtonAlignment.left).toBe(LabelAlignment.left);
      expect(IconButtonAlignment.right).toBe(LabelAlignment.right);
    });

    it('should have numeric enums support reverse mapping (value → key)', () => {
      expect(AuxiliaryButtonAlignment[0]).toBe('left');
      expect(AuxiliaryButtonAlignment[1]).toBe('right');
      expect(States[0]).toBe('loading');
      expect(States[3]).toBe('loaded');
      expect(Receipts[3]).toBe('read');
    });

    it('should have string enums NOT support reverse mapping', () => {
      expect((Placement as any)['top']).toBe('top');
      expect((EnterKeyBehavior as any)['sendMessage']).toBeUndefined();
    });

    it('should have all 31 enums importable from the module', () => {
      const allEnums = [
        AuxiliaryButtonAlignment,
        EnterKeyBehavior,
        Placement,
        MessageListAlignment,
        MessageBubbleAlignment,
        DocumentIconAlignment,
        TabAlignment,
        MessageStatus,
        Receipts,
        TitleAlignment,
        SelectionMode,
        States,
        TimestampAlignment,
        IconButtonAlignment,
        RecordingType,
        TabsVisibility,
        CallWorkflow,
        PanelAlignment,
        LabelAlignment,
        ElementType,
        ButtonAction,
        HTTPSRequestMethods,
        DateTimePickerMode,
        UserMemberListType,
        MouseEventSource,
        PreviewMessageMode,
        MentionsTargetElement,
        MentionsVisibility,
        CometChatSearchScope,
        CometChatSearchFilter,
        MentionType,
      ];
      for (const e of allEnums) {
        expect(e).toBeDefined();
        expect(typeof e).toBe('object');
      }
    });
  });
});
