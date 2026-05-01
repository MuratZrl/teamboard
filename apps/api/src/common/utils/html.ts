// Fix: H2 — escape user-controlled strings before interpolating into email HTML.
//
// Order matters: the `&` replacement runs first so we don't double-escape the
// ampersands introduced by subsequent replacements (e.g. `<` → `&lt;`).
//
// Scope: this five-character set is correct for HTML *text content* and
// *quoted attribute values* (the contexts we actually use in email templates,
// e.g. `<p>${x}</p>` and `<a href="${x}">`). It is NOT sufficient for:
//   - JavaScript contexts (e.g. `<script>var x = '${x}'</script>`)
//   - Unquoted attribute values (e.g. `<a href=${x}>`)
//   - URL contexts where the value forms part of a path/query (use encodeURIComponent)
//   - CSS contexts (e.g. `<style>color: ${x}</style>`)
// If email templates ever embed dynamic JS, use unquoted attributes, or
// inject into CSS, extend this helper or pick a context-aware library.
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
