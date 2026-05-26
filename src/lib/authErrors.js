/** Mappe les erreurs Supabase Auth vers des clés i18n. */
export function getAuthErrorKey(error) {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();

  if (code === 'over_email_send_rate_limit' || msg.includes('email rate limit')) {
    return 'auth_error_email_rate_limit';
  }
  if (code === 'over_request_rate_limit' || msg.includes('request rate limit')) {
    return 'auth_error_request_rate_limit';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'auth_error_email_not_confirmed';
  }
  if (code === 'user_already_exists' || msg.includes('already registered')) {
    return 'auth_error_user_exists';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'auth_error_weak_password';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'auth_error_invalid_credentials';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'auth_error_invalid_email';
  }
  if (msg.includes('signup is disabled')) {
    return 'auth_error_signup_disabled';
  }
  // Ancien message générique — ne pas confondre avec la limite d’e-mails Supabase
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'auth_error_request_rate_limit';
  }
  return null;
}

/** Compte déjà créé : signUp renvoie un user sans identité (anti-énumération). */
export function isSignupExistingUser(user) {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}
