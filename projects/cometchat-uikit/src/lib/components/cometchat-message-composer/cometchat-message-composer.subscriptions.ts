import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CometChatUIEvents, IMentionsCountWarning} from '../../events/CometChatUIEvents';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {MessageStatus} from '../../Enums/Enums';

export function subscribeToActivePopoverEventImpl(ctx: any): void {
  CometChatUIEvents.ccActivePopover.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((id: string) => {
    if (ctx.contentToDisplay() !== 'none' && ctx.contentToDisplay() !== id) {
      ctx.contentToDisplay.set('none');
      ctx.syncLegacyPopoverSignals();
    }
  });
}

export function subscribeToReplyToMessageEventImpl(ctx: any): void {
  CometChatMessageEvents.ccReplyToMessage.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: any) => {
    if (data.status === MessageStatus.inprogress) {
      ctx.enterReplyMode(data.message);
    } else if (data.status === MessageStatus.success || data.status === MessageStatus.cancelled) {
      ctx.exitReplyMode();
    }
  });
}

export function subscribeToMessageEditedEventImpl(ctx: any): void {
  CometChatMessageEvents.ccMessageEdited.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: any) => {
    const eventParentId = data.parentMessageId;
    const composerParentId = ctx.parentMessageId;
    if (composerParentId) {
      if (!eventParentId || eventParentId !== composerParentId) {
        return;
      }
    } else {
      if (eventParentId) {
        return;
      }
    }
    if (data.status === MessageStatus.inprogress) {
      ctx.enterEditMode(data.message);
    } else if (data.status === MessageStatus.success || data.status === MessageStatus.cancelled) {
      ctx.exitEditModeWithoutEvent();
    }
  });
}

export function subscribeToMessageDeletedEventImpl(ctx: any): void {
  CometChatMessageEvents.ccMessageDeleted.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(
    (message: any) => {
      if (ctx.messageToEdit && ctx.messageToEdit.getId() === message.getId()) {
        ctx.exitEditModeWithoutEvent();
      }
    }
  );
}

export function subscribeToComposeMessageEventImpl(ctx: any): void {
  CometChatUIEvents.ccComposeMessage.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(
    (text: string) => {
      ctx.insertTextFromExternalSource(text);
      ctx.textChange.emit(ctx.composerText());
      ctx.focusRichTextEditor();
    }
  );
}

export function subscribeToSdkMessageDeletedEventImpl(ctx: any): void {
  CometChatMessageEvents.onMessageDeleted.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(
    (message: any) => {
      if (ctx.messageToEdit && ctx.messageToEdit.getId() === message.getId()) {
        ctx.exitEditModeWithoutEvent();
      }
      const editingMessage = ctx.textMessageToEdit();
      if (editingMessage && editingMessage.getId() === message.getId()) {
        ctx.exitEditModeWithoutEvent();
      }
    }
  );
}

export function subscribeToShowModalEventImpl(ctx: any): void {
  CometChatUIEvents.ccShowModal.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: any) => {
    const { composerId } = data;
    const parentMessageId = ctx.parentMessageId;
    const userId = ctx.currentUser()?.getUid();
    const groupId = ctx.currentGroup()?.getGuid();
    if (composerId) {
      if (
        (composerId.parentMessageId &&
          parentMessageId &&
          composerId.parentMessageId === parentMessageId) ||
        (!parentMessageId && (composerId.user === userId || composerId.group === groupId)) ||
        (!composerId.parentMessageId && !composerId.user && !composerId.group)
      ) {
        ctx.openPollModal();
      }
    } else {
      ctx.openPollModal();
    }
  });
}

export function subscribeToHideModalEventImpl(ctx: any): void {
  CometChatUIEvents.ccHideModal.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe(() => {
    ctx.closePollModal();
  });
}

export function subscribeToShowMentionsCountWarningEventImpl(ctx: any): void {
  CometChatUIEvents.ccShowMentionsCountWarning.pipe(takeUntilDestroyed(ctx.destroyRef)).subscribe((data: IMentionsCountWarning) => {
    const formatter = ctx.mentionsFormatter();
    if (data.id && formatter && data.id !== formatter.id) {
      return;
    }
    ctx.showMentionsCountWarning.set(data.showWarning);
  });
}
