export function focusTextInputImpl(self: any): void {
  const textInput = self.textInputRef?.nativeElement;
  if (textInput) {
    setTimeout(() => {
      textInput.focus();
      const textLength = textInput.value.length;
      textInput.setSelectionRange(textLength, textLength);
    }, 50);
  }
}

export function focusAttachmentButtonImpl(self: any): void {
  const el = self.attachmentButtonRef?.nativeElement;
  if (el) {
    setTimeout(() => {
      const btn = el.querySelector('button') as HTMLButtonElement;
      (btn || el).focus();
    }, 0);
  }
}

export function focusEmojiButtonImpl(self: any): void {
  const el = self.emojiButtonRef?.nativeElement;
  if (el) {
    setTimeout(() => {
      const btn = el.querySelector('button') as HTMLButtonElement;
      (btn || el).focus();
    }, 0);
  }
}

export function focusStickersButtonImpl(self: any): void {
  const el = self.stickersButtonRef?.nativeElement;
  if (el) {
    setTimeout(() => {
      const btn = el.querySelector('button') as HTMLButtonElement;
      (btn || el).focus();
    }, 0);
  }
}

export function focusVoiceButtonImpl(self: any): void {
  const el = self.voiceButtonRef?.nativeElement;
  if (el) {
    setTimeout(() => {
      const btn = el.querySelector('button') as HTMLButtonElement;
      (btn || el).focus();
    }, 0);
  }
}

export function insertTextAtCursorImpl(self: any, textToInsert: string): number {
  const currentText = self.composerText();
  const currentCursorPos = self.cursorPosition();
  const safePosition = Math.min(Math.max(0, currentCursorPos), currentText.length);
  const textBefore = currentText.substring(0, safePosition);
  const textAfter = currentText.substring(safePosition);
  const newText = textBefore + textToInsert + textAfter;
  self.composerText.set(newText);
  const newCursorPosition = safePosition + textToInsert.length;
  return newCursorPosition;
}
