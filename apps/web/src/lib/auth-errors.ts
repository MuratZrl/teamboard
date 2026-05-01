// Stable error codes surfaced from auth flows. The backend's actual messages
// are surfaced for register via direct HTTP, but for login (which goes through
// NextAuth's authorize) we map codes -> user-facing strings here.
//
// Codes are intentionally short and URL-safe — NextAuth v5 puts them in the
// `code` query parameter on its own error page, and we want them stable across
// renames. Add a new code by appending to AuthErrorCode AND the map below.
export type AuthErrorCode =
  | 'email_taken'
  | 'invalid_credentials'
  | 'invalid_input'
  | 'rate_limited'
  | 'server_error';

const MESSAGES: Record<AuthErrorCode, string> = {
  email_taken: 'An account with this email already exists. Try signing in instead.',
  invalid_credentials: 'Invalid email or password.',
  invalid_input: 'Please check the form. Some fields don’t meet the requirements.',
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
  server_error: 'Something went wrong on our side. Please try again.',
};

export function getAuthErrorMessage(
  code: string | null | undefined,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (code && code in MESSAGES) return MESSAGES[code as AuthErrorCode];
  return fallback;
}

// Maps an HTTP response from the backend auth endpoints to a stable code.
// The body is whatever JSON we managed to parse (or null if parsing failed).
export function classifyAuthError(
  status: number,
  body: { message?: unknown } | null,
): AuthErrorCode {
  if (status === 409) return 'email_taken';
  if (status === 400) return 'invalid_input';
  if (status === 401) return 'invalid_credentials';
  if (status === 429) return 'rate_limited';
  // Includes 500, parse failures, and anything else we don't recognize.
  // body is unused today but kept in the signature so future codes can
  // disambiguate (e.g. distinguishing different 400 sub-cases).
  void body;
  return 'server_error';
}
