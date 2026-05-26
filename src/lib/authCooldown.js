const RESEND_KEY = 'tkv_auth_resend_until';

export function getResendCooldownMs(email) {
  try {
    const raw = localStorage.getItem(RESEND_KEY);
    if (!raw) return 0;
    const { until, address } = JSON.parse(raw);
    if (address !== email?.trim().toLowerCase()) return 0;
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

export function setResendCooldown(email, seconds = 60) {
  localStorage.setItem(
    RESEND_KEY,
    JSON.stringify({
      address: email.trim().toLowerCase(),
      until: Date.now() + seconds * 1000,
    }),
  );
}
