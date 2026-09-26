/**
 * CLAUSETRACE Enterprise Security & Sanitization Suite
 * 
 * Provides robust defense-in-depth sanitization for:
 * 1. User text input & search queries (XSS prevention)
 * 2. Raw HTML / rich legal text escaping
 * 3. Prompt injection neutralization
 * 4. Safe URL and URI scheme validation
 */

/**
 * Escapes unsafe HTML characters to prevent XSS injection.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips dangerous HTML tags and script elements from rich text.
 */
export function stripUnsafeTags(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^"']*/gi, '');
}

/**
 * Sanitizes user search queries and filter inputs.
 * Trims excess whitespace, strips control characters, and enforces length bounds.
 */
export function sanitizeSearchQuery(query: string | null | undefined, maxLength = 200): string {
  if (!query) return '';
  return String(query)
    // Remove invisible ASCII control characters except standard whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Neutralizes potential prompt injection markers before sending to LLM pipelines.
 */
export function sanitizePromptInput(input: string | null | undefined, maxLength = 50000): string {
  if (!input) return '';
  let sanitized = String(input)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);

  // Neutralize common delimiter break attempts
  sanitized = sanitized.replace(/```(system|developer|assistant|user)/gi, '``` [escaped block]');
  return sanitized;
}

/**
 * Validates that an avatar or external resource URL uses safe HTTP/HTTPS or data URI protocols.
 */
export function isValidSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    // Relative paths are acceptable if starting with /
    return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
  }
}
