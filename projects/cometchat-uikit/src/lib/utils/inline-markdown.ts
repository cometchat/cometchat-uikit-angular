/**
 * Inline-only markdown → HTML, for single-line surfaces (reply/edit previews, quoted messages).
 *
 * Deliberately NOT the block-level converter in `services/rich-text-editor.markdown-utils`: that one
 * emits <p>/<ul>/<blockquote>, which a one-line preview can't lay out.
 *
 * The input MUST already be HTML-escaped — this function emits tags, so anything it is handed is
 * trusted to contain no user-authored markup. Sanitize the result before binding it to innerHTML.
 */
export function convertInlineMarkdownToHtml(text: string): string {
  if (!text) return '';
  let result = text;
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<u>$1</u>');
  result = result.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>');
  result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return result;
}
