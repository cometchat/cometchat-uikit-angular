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
  // Convert links first and park them behind placeholders, so the bold/italic/underline
  // passes can't rewrite markers inside a URL (e.g. `_` in https://example.com/a_b_c).
  const links: string[] = [];
  let result = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_match, label: string, url: string) => {
    links.push(url);
    return `[${label}]\u0000${links.length - 1}\u0000`;
  });
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<strong>$1</strong>');
  result = result.replace(/__([^_]+)__/g, '<u>$1</u>');
  result = result.replace(/(?<!_)_(?!_)([^_]+)_(?!_)/g, '<em>$1</em>');
  result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  result = result.replace(
    /\[([^\]]+)\]\u0000(\d+)\u0000/g,
    (_match, label: string, index: string) =>
      `<a href="${links[Number(index)]}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
  return result;
}
